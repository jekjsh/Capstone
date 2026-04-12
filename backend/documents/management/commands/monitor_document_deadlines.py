from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from documents.models import Document
from monitoring.models import Notification, AuditLog


class Command(BaseCommand):
    help = 'Monitor documents for expiring validity dates and create notifications'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to look ahead for expiring documents (default: 30)',
        )

    def handle(self, *args, **options):
        days_ahead = options['days']
        today = date.today()
        future_date = today + timedelta(days=days_ahead)
        
        self.stdout.write(f"Scanning for documents expiring within {days_ahead} days...")
        
        # Find documents with approaching validity dates
        expiring_documents = Document.objects.filter(
            validity_date__isnull=False,
            validity_date__gte=today,
            validity_date__lte=future_date
        ).order_by('validity_date')
        
        if not expiring_documents.exists():
            self.stdout.write(self.style.SUCCESS("No expiring documents found."))
            return
        
        alert_count = 0
        
        for document in expiring_documents:
            days_until_expiry = (document.validity_date - today).days
            
            # Create notification for the document owner
            try:
                # Check if notification already exists for this document and expiry alert
                existing = Notification.objects.filter(
                    recipient_user=document.user_index,
                    doc=document,
                    notif_msg__contains="expir"
                ).exists()
                
                if not existing:
                    message = (
                        f"Document '{document.doc_name}' expires in {days_until_expiry} day(s) "
                        f"on {document.validity_date.strftime('%Y-%m-%d')}"
                    )
                    
                    Notification.objects.create(
                        recipient_user=document.user_index,
                        actor_user=document.user_index,  # System-generated notification
                        doc=document,
                        notif_msg=message
                    )
                    
                    # Log the notification
                    AuditLog.objects.create(
                        user_index=document.user_index,
                        audit_action='Document Expiry Alert',
                        audit_desc=message,
                        audit_status='Success'
                    )
                    
                    alert_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f"Alert: '{document.doc_name}' expires in {days_until_expiry} day(s)"
                        )
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error processing document {document.doc_id}: {str(e)}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully created {alert_count} notification(s)")
        )
