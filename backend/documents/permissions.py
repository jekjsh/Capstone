from rest_framework import permissions
from .models import Folder, FolderShare


class IsOrgMember(permissions.BasePermission):
    """
    Allow access if user is a member of an organization.
    """
    def has_permission(self, request, view):
        return request.user and request.user.org is not None


class CanAccessFolder(permissions.BasePermission):
    """
    Control access to folders based on organization ownership and sharing.
    
    Rules:
    - Folder owner org: full access
    - Shared with org: can view and list, but only their org's documents
    - Other orgs: no access
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.org:
            return False
        
        # Folder owner org has full access
        if obj.owning_org == user.org:
            return True
        
        # Check if folder is shared with user's org
        is_shared = FolderShare.objects.filter(
            folder=obj,
            shared_with_org=user.org
        ).exists()
        
        # If folder is shared, user can access it (but more granular controls
        # apply to what documents they can see)
        if is_shared:
            return True
        
        return False


class CanAccessDocument(permissions.BasePermission):
    """
    Control access to documents based on organization and folder sharing.
    
    Rules:
    - User's org owns the document: can view/edit/delete
    - Folder owner org: can view all documents in the folder
    - Shared folder, different org: can only see documents uploaded by your org
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.org:
            return False
        
        # User's org owns the document - full access
        if obj.owning_org == user.org:
            return True
        
        # Check folder access
        if obj.folder:
            # Folder owner org can see all documents in their folder
            if obj.folder.owning_org == user.org:
                return True
            
            # Check if folder is shared with user's org
            is_shared = FolderShare.objects.filter(
                folder=obj.folder,
                shared_with_org=user.org
            ).exists()
            
            # Shared folder - can only see documents from your own org
            if is_shared and obj.owning_org == user.org:
                return True
        
        return False


class CanEditDocument(permissions.BasePermission):
    """
    Control who can edit/delete documents.
    
    Rules:
    - Only owner org can edit/delete (or folder owner org)
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.org:
            return False
        
        # User's org owns the document
        if obj.owning_org == user.org:
            return True
        
        # Folder owner org can edit documents in their folder
        if obj.folder and obj.folder.owning_org == user.org:
            return True
        
        return False


class CanShareFolder(permissions.BasePermission):
    """
    Control who can create folder shares.
    
    Rules:
    - Only folder owner org can share the folder
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.org:
            return False
        
        # Only owner org can share
        return obj.folder.owning_org == user.org


class CanAccessDocumentShare(permissions.BasePermission):
    """
    Control access to individual document shares (user-to-user).
    
    Rules:
    - User can see shares they created or received
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        return obj.shared_by_user == user or obj.shared_to_user == user
