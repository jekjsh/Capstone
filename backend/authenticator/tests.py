from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from authenticator.models import CustomUser, Organization
from documents.models import Document, Folder
from monitoring.models import Notification, AuditLog


class OrganizationDeletionSafeguardTests(APITestCase):
	def setUp(self):
		self.org_owner = Organization.objects.create(
			org_name='Owner Org',
			org_desc='Owns records',
			org_code='OWN',
			org_type='department',
		)
		self.org_empty = Organization.objects.create(
			org_name='Empty Org',
			org_desc='No records',
			org_code='EMPTY',
			org_type='department',
		)

		self.admin_user = CustomUser.objects.create_user(
			user_id='sysadmin001',
			email_add='sysadmin001@example.com',
			password='testpass123',
			first_name='System',
			last_name='Admin',
			org=self.org_owner,
			role_type='system_admin',
			is_staff=True,
			is_superuser=True,
		)

		self.owner_user = CustomUser.objects.create_user(
			user_id='owner001',
			email_add='owner001@example.com',
			password='testpass123',
			first_name='Owner',
			last_name='User',
			org=self.org_owner,
			role_type='admin',
		)

		self.folder = Folder.objects.create(
			folder_name='Owner Folder',
			user_index=self.owner_user,
			created_by_user=self.owner_user,
			owning_org=self.org_owner,
			org=self.org_owner,
		)
		self.document = Document.objects.create(
			doc_name='Owner Doc',
			user_index=self.owner_user,
			uploaded_by_user=self.owner_user,
			owning_org=self.org_owner,
			folder=self.folder,
		)

	def test_cannot_delete_org_with_owned_records(self):
		self.client.force_authenticate(user=self.admin_user)

		url = reverse('organization-detail', args=[self.org_owner.org_id])
		response = self.client.delete(url)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('Cannot delete organization', response.data.get('detail', ''))
		self.assertTrue(Organization.objects.filter(org_id=self.org_owner.org_id).exists())

	def test_can_delete_empty_org(self):
		self.client.force_authenticate(user=self.admin_user)

		url = reverse('organization-detail', args=[self.org_empty.org_id])
		response = self.client.delete(url)

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(Organization.objects.filter(org_id=self.org_empty.org_id).exists())

	def test_can_delete_org_after_archiving_owned_records(self):
		self.client.force_authenticate(user=self.admin_user)

		self.folder.is_archived = True
		self.folder.save(update_fields=['is_archived'])
		self.document.is_archived = True
		self.document.save(update_fields=['is_archived'])

		url = reverse('organization-detail', args=[self.org_owner.org_id])
		response = self.client.delete(url)

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(Organization.objects.filter(org_id=self.org_owner.org_id).exists())


class UserAccessDisableSafeguardTests(APITestCase):
	def setUp(self):
		self.org = Organization.objects.create(
			org_name='Ops Org',
			org_desc='Operations',
			org_code='OPS',
			org_type='department',
		)

		self.system_admin = CustomUser.objects.create_user(
			user_id='sysadmin_access_disable',
			email_add='sysadmin_access_disable@example.com',
			password='testpass123',
			first_name='System',
			last_name='Admin',
			org=self.org,
			role_type='system_admin',
			is_staff=True,
			is_superuser=True,
		)

		self.org_admin = CustomUser.objects.create_user(
			user_id='orgadmin001',
			email_add='orgadmin001@example.com',
			password='testpass123',
			first_name='Org',
			last_name='Admin',
			org=self.org,
			role_type='admin',
		)

		self.target_user = CustomUser.objects.create_user(
			user_id='user001',
			email_add='user001@example.com',
			password='testpass123',
			first_name='Target',
			last_name='User',
			org=self.org,
			role_type='user',
			is_active=True,
		)

		self.folder = Folder.objects.create(
			folder_name='Private Work',
			user_index=self.target_user,
			created_by_user=self.target_user,
			owning_org=self.org,
			org=self.org,
		)
		Document.objects.create(
			doc_name='Private Doc',
			user_index=self.target_user,
			uploaded_by_user=self.target_user,
			owning_org=self.org,
			folder=self.folder,
		)

	def test_deactivate_user_triggers_access_disable_safeguard(self):
		self.client.force_authenticate(user=self.system_admin)

		url = reverse('user-detail', args=[self.target_user.user_id])
		response = self.client.patch(url, {'is_active': False}, format='json')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(Notification.objects.filter(recipient_user=self.org_admin, actor_user=self.system_admin).exists())
		self.assertTrue(AuditLog.objects.filter(audit_action='User Access Disabled Safeguard', audit_status='Success').exists())
