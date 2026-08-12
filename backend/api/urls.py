""" API URLS """

from django.urls import include, path
from civicconnectapp.views import *

urlpatterns = [
    #Public - accessible to all users
    path('register/',RegisterAPI.as_view(),name='register'),
    path('login/',LoginAPI.as_view(),name='login'),
    path('district/',DistrictAPI.as_view(),name='district'),
    
###########################################################################################
    # Admin
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('admin/users/',AdminUserViewAPI.as_view(),name='adminusers'),
    path("admin/users/<int:pk>/", AdminUserDetailAPIView.as_view(), name="admin-user-detail"),
    path("admin/departments/",DepartmentAPIView.as_view(),name="admin-departments"),
    path("admin/departments/<int:pk>/branches/",DepartmentBranchesAPIView.as_view(),name="admin-department-branches"),
    path("admin/departments/<int:pk>/",DepartmentDetailAPIView.as_view(),name="department-detail"),
    path("admin/branches/<int:pk>/verify/",VerifyBranchAPIView.as_view(),name="admin-verify-branch"),


###########################################################################################
    # Department

    
###########################################################################################
    # Branches
    
###########################################################################################
    # Dept-Employee
    
###########################################################################################
    # Users
    
###########################################################################################
    # Representatives
    
###########################################################################################
    # myward
    

]


