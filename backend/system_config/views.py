from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SystemTheme
from .serializers import SystemThemeSerializer


class SystemThemeViewSet(viewsets.ModelViewSet):
    """ViewSet for system themes. Only admins can edit."""
    queryset = SystemTheme.objects.all()
    serializer_class = SystemThemeSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'active_theme']:
            # Anyone can view themes (active_theme is public)
            permission_classes = [permissions.AllowAny]
        else:
            # Only admins can create/update/delete themes
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def active_theme(self, request):
        """Get the currently active theme - PUBLIC endpoint"""
        try:
            theme = SystemTheme.objects.filter(is_theme_active=True).first()
            if theme:
                serializer = self.get_serializer(theme)
                return Response(serializer.data)
            # If no active theme, return default
            return Response({
                'sys_id': None,
                'sys_name': 'Record Keeping Management System',
                'sys_abbr': 'RKMS',
                'sys_logo': None,
                'sys_backg': None,
                'sidebar_color': 'blue',
                'is_theme_active': False,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
