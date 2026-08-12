from rest_framework.permissions import BasePermission
from .models import DeptEmployees

class IsDeptEmployee(BasePermission):
    """Allows access only to users who are assigned as an employee of the branch being accessed."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return DeptEmployees.objects.filter(user_details=request.user).exists()

    def has_object_permission(self, request, view, obj):
        # obj can be a DeptDetails (branch) or a Complaint (has .branch)
        branch = obj if hasattr(obj, 'dept') else obj.branch
        return DeptEmployees.objects.filter(
            user_details=request.user, dept_details=branch
        ).exists()
        
        