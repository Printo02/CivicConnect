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
    path("admin/depts/create/", DeptCreateView.as_view(), name="dept-create"),
    path("admin/depts/", DeptListView.as_view(), name="dept-list"),
    path("admin/depts/<int:pk>/generate/", DeptGenerateCredentialsView.as_view(), name="dept-generate"),
    path('admin/constituencies/', ConstituencyListCreateView.as_view()),
    path('admin/constituencies/<int:pk>/', ConstituencyDetailView.as_view()),
    path('admin/constituencies/types/', ConstituencyTypesView.as_view()),
    path('admin/constituencies/<int:pk>/assign/', AssignRepresentativeView.as_view()),
    path("admin/representatives/", RepresentativeListCreateView.as_view(), name="representative-list-create"),
    path("admin/representatives/<int:pk>/", RepresentativeDetailView.as_view(), name="representative-detail"),
    path("admin/constituencies/<int:constituency_id>/representative/",RepresentativesByConstituencyView.as_view(),name="representative-by-constituency"),
    path("admin/departments/add/",AddDepartmentAPIView.as_view(),name="add-department"),
    path("admin/departments/",DepartmentListAPIView.as_view(),name="department-list"),
    path("admin/departments/<int:pk>/",DepartmentDetailAPIView.as_view(),name="department-detail"),
    path("admin/departments/<int:pk>/delete/",DeleteDepartmentAPI.as_view(),name="delete-department"),


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


