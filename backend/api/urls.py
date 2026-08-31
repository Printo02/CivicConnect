""" API URLS """

from django.urls import include, path
from civicconnectapp.views import *

urlpatterns = [
    ######################################## Public - accessible to all users ########################################
    path('register/',RegisterAPI.as_view(),name='register'),
    path('login/',LoginAPI.as_view(),name='login'),
    path('district/',DistrictAPI.as_view(),name='district'),
    
    ######################################## Admin ########################################
    path('admin/profile/', ProfileView.as_view(), name='profile'),
    path('admin/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('admin/users/',AdminUserViewAPI.as_view(),name='adminusers'),
    path("admin/users/<int:pk>/", AdminUserDetailAPIView.as_view(), name="admin-user-detail"),
    # path("admin/departments/",DepartmentAPIView.as_view(),name="admin-departments"),
    # path("admin/departments/<int:pk>/branches/",DepartmentBranchesAPIView.as_view(),name="admin-department-branches"),
    path("admin/departments/<int:pk>/",DepartmentDetailAPIView.as_view(),name="department-detail"),
    # path("admin/branches/<int:pk>/verify/",VerifyBranchAPIView.as_view(),name="admin-verify-branch"),
    # path("admin/depts/create/", DeptCreateView.as_view(), name="dept-create"),
    # path("admin/depts/", DeptListView.as_view(), name="dept-list"),
    # path("admin/depts/<int:pk>/generate/", DeptGenerateCredentialsView.as_view(), name="dept-generate"),
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
    path("admin/representatives/<int:pk>/status/",RepresentativeStatusView.as_view(),name="representative-status"),
    
    
    
    ######################################## Department ########################################
    path("dept/profile/",DeptProfileView.as_view(),name="DeptProfile"),
    path('dept/change-password/', DeptChangePasswordView.as_view(), name='Dept-Change-password'),
    path('dept/branches/', DeptBranchListAPIView.as_view(), name='Dept-branch'),
    path('dept/branches/addbranches/', DeptAddBranchAPIView.as_view(), name='Dept-add-branch'),
    # path('dept/branches/<int:pk>/delete/', DeptAddBranchAPIView.as_view(), name='Dept-add-branch'),
    path('dept/branches/<int:pk>/', DeptBranchDetailAPIView.as_view()),


    ######################################## Branches ########################################
    path("branch/profile/",BranchProfileView.as_view(),name="BranchProfile"),
    path('branch/change-password/', BranchChangePasswordView.as_view(), name='Branch-Change-password'),
    path('branch/branchemployee/', BranchEmployeesAPIView.as_view(), name='Branch-list-employee'),
    path('branch/branchemployee/add/', BranchAddEmployeeAPIView.as_view(), name='Branch-add-employee'),
    path('branch/branchemployee/<int:pk>/', BranchDeleteEmployeeAPIView.as_view(), name='Branch-delete-employee'),





    ######################################## Branches-Employee ########################################



    ######################################## Representatives ########################################
    path("representative/profile/",RepresentativeProfileView.as_view(),name="representative-profile"),
    path('representative/change-password/', BranchChangePasswordView.as_view(), name='representative-Change-password'),
    path("representative/constituency/",RepresentativeConstituencyView.as_view(),name="representative-constituency"),





    ######################################## Users ########################################
    path("user/profile/",UserProfileView.as_view(),name="user-profile"),
    path("user/change-password/",UserChangePasswordView.as_view(),name="user-change-password"),


    ######################################## myward ########################################


]


