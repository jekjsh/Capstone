from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from authenticator.models import CustomUser, Organization
from documents.models import Document, Folder, FolderShare


class OrgOwnershipAccessTests(APITestCase):
	def setUp(self):
		self.org_hr = Organization.objects.create(
			org_name='HR Department',
			org_desc='Owner org',
			org_code='HR',
			org_type='department',
		)
		self.org_sales = Organization.objects.create(
			org_name='Sales Department',
			org_desc='Shared org',
			org_code='SALES',
			org_type='department',
		)
		self.org_it = Organization.objects.create(
			org_name='IT Department',
			org_desc='Unrelated org',
			org_code='IT',
			org_type='department',
		)

		self.user_hr = CustomUser.objects.create_user(
			user_id='hr001',
			email_add='hr001@example.com',
			password='testpass123',
			first_name='HR',
			last_name='Owner',
			org=self.org_hr,
			role_type='admin',
		)
		self.user_sales = CustomUser.objects.create_user(
			user_id='sales001',
			email_add='sales001@example.com',
			password='testpass123',
			first_name='Sales',
			last_name='User',
			org=self.org_sales,
			role_type='user',
		)
		self.user_it = CustomUser.objects.create_user(
			user_id='it001',
			email_add='it001@example.com',
			password='testpass123',
			first_name='IT',
			last_name='User',
			org=self.org_it,
			role_type='user',
		)

		self.folder = Folder.objects.create(
			folder_name='Quarterly Reports',
			user_index=self.user_hr,
			created_by_user=self.user_hr,
			owning_org=self.org_hr,
			org=self.org_hr,
		)

		FolderShare.objects.create(
			folder=self.folder,
			shared_by_org=self.org_hr,
			shared_with_org=self.org_sales,
			share_msg='Submit your reports here',
		)

		self.doc_hr = Document.objects.create(
			doc_name='HR Master Report',
			user_index=self.user_hr,
			uploaded_by_user=self.user_hr,
			owning_org=self.org_hr,
			folder=self.folder,
		)
		self.doc_sales = Document.objects.create(
			doc_name='Sales Report',
			user_index=self.user_sales,
			uploaded_by_user=self.user_sales,
			owning_org=self.org_sales,
			folder=self.folder,
		)

	def test_shared_org_lists_docs_but_cannot_open_other_org_file(self):
		self.client.force_authenticate(user=self.user_sales)

		url = reverse('folder-documents', args=[self.folder.folder_id])
		response = self.client.get(url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 2)

		docs_by_name = {item['doc_name']: item for item in response.data}
		self.assertIn('HR Master Report', docs_by_name)
		self.assertIn('Sales Report', docs_by_name)

		self.assertFalse(docs_by_name['HR Master Report']['can_open'])
		self.assertTrue(docs_by_name['Sales Report']['can_open'])

	def test_shared_org_cannot_retrieve_other_org_document(self):
		self.client.force_authenticate(user=self.user_sales)

		url = reverse('document-detail', args=[self.doc_hr.doc_id])
		response = self.client.get(url)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_shared_org_can_retrieve_its_own_document(self):
		self.client.force_authenticate(user=self.user_sales)

		url = reverse('document-detail', args=[self.doc_sales.doc_id])
		response = self.client.get(url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['doc_name'], 'Sales Report')

	def test_shared_org_can_upload_to_shared_folder(self):
		self.client.force_authenticate(user=self.user_sales)

		url = reverse('document-list')
		payload = {
			'doc_name': 'Sales Follow-up',
			'folder': self.folder.folder_id,
		}
		response = self.client.post(url, payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		created = Document.objects.get(doc_id=response.data['doc_id'])
		self.assertEqual(created.owning_org_id, self.org_sales.org_id)
		self.assertEqual(created.uploaded_by_user_id, self.user_sales.user_index)

	def test_unshared_org_cannot_upload_to_folder(self):
		self.client.force_authenticate(user=self.user_it)

		url = reverse('document-list')
		payload = {
			'doc_name': 'Unauthorized Upload',
			'folder': self.folder.folder_id,
		}
		response = self.client.post(url, payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_shared_org_cannot_update_folder(self):
		self.client.force_authenticate(user=self.user_sales)

		url = reverse('folder-detail', args=[self.folder.folder_id])
		response = self.client.patch(url, {'folder_name': 'Tampered Name'}, format='json')

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_owner_can_archive_document(self):
		self.client.force_authenticate(user=self.user_sales)

		url = reverse('document-archive', args=[self.doc_sales.doc_id])
		response = self.client.post(url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.doc_sales.refresh_from_db()
		self.assertTrue(self.doc_sales.is_archived)

	def test_owner_can_archive_folder_and_its_documents(self):
		self.client.force_authenticate(user=self.user_hr)

		url = reverse('folder-archive', args=[self.folder.folder_id])
		response = self.client.post(url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.folder.refresh_from_db()
		self.doc_hr.refresh_from_db()
		self.doc_sales.refresh_from_db()
		self.assertTrue(self.folder.is_archived)
		self.assertTrue(self.doc_hr.is_archived)
		self.assertTrue(self.doc_sales.is_archived)

	def test_document_history_returns_ownership_and_events(self):
		self.client.force_authenticate(user=self.user_hr)

		url = reverse('document-history', args=[self.doc_hr.doc_id])
		response = self.client.get(url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['document']['doc_id'], self.doc_hr.doc_id)
		self.assertEqual(response.data['document']['owning_org_id'], self.org_hr.org_id)
		self.assertGreaterEqual(len(response.data['events']), 1)

	def test_folder_history_returns_ownership_and_events(self):
		self.client.force_authenticate(user=self.user_hr)

		url = reverse('folder-history', args=[self.folder.folder_id])
		response = self.client.get(url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['folder']['folder_id'], self.folder.folder_id)
		self.assertEqual(response.data['folder']['owning_org_id'], self.org_hr.org_id)
		self.assertGreaterEqual(len(response.data['events']), 1)
