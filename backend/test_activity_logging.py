#!/usr/bin/env python
"""
Test script to verify ActivityLog and RecentActivity functionality
Run this after the migrations are applied
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authenticator.models import ActivityLog, CustomUser, LoginLog
from django.utils import timezone

def test_activity_logging():
    """Test the activity logging system"""
    
    print("\n" + "="*60)
    print("ACTIVITY LOGGING TEST")
    print("="*60)
    
    # Get a test user (you may need to create one)
    try:
        user = CustomUser.objects.first()
        if not user:
            print("❌ No users found in database")
            print("   Please create a user first")
            return
    except Exception as e:
        print(f"❌ Error fetching user: {e}")
        return
    
    print(f"✓ Found user: {user.username}")
    
    # Test 1: Create activity logs
    print("\n--- Test 1: Creating Activity Logs ---")
    
    try:
        # Create login activity
        login_log = ActivityLog.objects.create(
            user=user,
            action='login',
            ip_address='127.0.0.1'
        )
        print(f"✓ Created login activity: ID={login_log.id}")
        
        # Create document action
        doc_activity = ActivityLog.objects.create(
            user=user,
            action='create',
            target_doc='Test_Document.pdf',
            ip_address='127.0.0.1'
        )
        print(f"✓ Created document activity: ID={doc_activity.id}")
        
        # Create logout activity
        logout_log = ActivityLog.objects.create(
            user=user,
            action='logout',
            ip_address='127.0.0.1'
        )
        print(f"✓ Created logout activity: ID={logout_log.id}")
        
    except Exception as e:
        print(f"❌ Error creating activities: {e}")
        return
    
    # Test 2: Query recent activities
    print("\n--- Test 2: Querying Recent Activities ---")
    
    try:
        all_activities = ActivityLog.objects.all().order_by('-log_timestamp')
        print(f"✓ Total activities in database: {all_activities.count()}")
        
        recent = ActivityLog.objects.all().order_by('-log_timestamp')[:5]
        print(f"✓ Retrieved last 5 activities:")
        for activity in recent:
            print(f"  - {activity.user.username} | {activity.get_action_display():12} | {activity.target_doc or '-':20} | {activity.log_timestamp}")
        
    except Exception as e:
        print(f"❌ Error querying activities: {e}")
        return
    
    # Test 3: Test serializer
    print("\n--- Test 3: Testing ActivityLogSerializer ---")
    
    try:
        from authenticator.serializers import ActivityLogSerializer
        
        recent_activity = ActivityLog.objects.order_by('-log_timestamp').first()
        if recent_activity:
            serializer = ActivityLogSerializer(recent_activity)
            print(f"✓ Serialized activity:")
            for key, value in serializer.data.items():
                print(f"  {key}: {value}")
        else:
            print("⚠ No activities to serialize")
            
    except Exception as e:
        print(f"❌ Error testing serializer: {e}")
        return
    
    # Test 4: Filter by action type
    print("\n--- Test 4: Filtering by Action Type ---")
    
    try:
        login_count = ActivityLog.objects.filter(action='login').count()
        logout_count = ActivityLog.objects.filter(action='logout').count()
        document_count = ActivityLog.objects.filter(action='create').count()
        
        print(f"✓ Login activities: {login_count}")
        print(f"✓ Logout activities: {logout_count}")
        print(f"✓ Create activities: {document_count}")
        
    except Exception as e:
        print(f"❌ Error filtering: {e}")
        return
    
    # Test 5: Compare LoginLog with ActivityLog
    print("\n--- Test 5: LoginLog vs ActivityLog Comparison ---")
    
    try:
        login_logs = LoginLog.objects.all().count()
        activity_logs = ActivityLog.objects.all().count()
        
        print(f"✓ LoginLog entries: {login_logs}")
        print(f"✓ ActivityLog entries: {activity_logs}")
        
        if login_logs > 0:
            print("\n✓ Recent LoginLog entries:")
            for log in LoginLog.objects.order_by('-login_time')[:3]:
                status = "ACTIVE" if log.is_active() else "LOGGED OUT"
                print(f"  - {log.user.username} | {log.login_time} | {status}")
                
    except Exception as e:
        print(f"❌ Error comparing: {e}")
        return
    
    print("\n" + "="*60)
    print("✓ ALL TESTS PASSED!")
    print("="*60)
    print("\nYou can now:")
    print("1. View activities in Django admin: http://localhost:8000/admin/authenticator/activitylog/")
    print("2. Check recent activity in admin dashboard")
    print("3. Use the activity logger in frontend to log user actions")
    print()

if __name__ == '__main__':
    test_activity_logging()
