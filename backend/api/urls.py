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
    path('admin/dashboard/users/',AdminUserDashboardAPIView.as_view(),name='admin-user-dashboard'),
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
    path("admin/departments/<int:pk>/branches/",AdminDepartmentBranchesAPIView.as_view(),name="admin-department-branches"),
    path("admin/branches/<int:pk>/employees/",AdminBranchEmployeesAPIView.as_view(),name="admin-branch-employees"),
    path("admin/representatives/available-users/",AvailableRepresentativeUsersView.as_view(),
    name="available-representative-users"),
    
    
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
    path('branch/branchemployee/<int:pk>/status/',BranchEmployeeStatusAPIView.as_view(),name='branch-employee-status'),
    path('branch/complaints/', BranchComplaintsListView.as_view(), name='branch-complaints'),
    path('branch/complaints/<int:pk>/', ComplaintStatusUpdateView.as_view(), name='complaint-status-update'),
    ######################################## Branch: Assign Complaint ########################################
    path('branch/complaints/<int:pk>/assign/', BranchAssignComplaintView.as_view(), name='branch-complaint-assign'),
    path('branch/branchemployee/assignable/', BranchAssignableEmployeesView.as_view(), name='branch-assignable-employees'),

    ######################################## Branches-Employee ########################################
    path("branchemployee/profile/",BranchEmployeeProfileView.as_view(),name="branch-employee-profile"),
    path("branchemployee/change-password/",BranchEmployeeChangePasswordView.as_view(),name="branch-employee-change-password"),


    ######################################## Representatives ########################################
    path("representative/profile/",RepresentativeProfileView.as_view(),name="representative-profile"),
    path('representative/change-password/',RepresentativeChangePasswordView.as_view(),name='representative-Change-password'),
    path("representative/constituency/",RepresentativeConstituencyView.as_view(),name="representative-constituency"),
    path('representative/complaints/', RepresentativeComplaintsListView.as_view(), name='representative-complaints'),
    path('representative/complaints/<int:pk>/', RepresentativeComplaintStatusUpdateView.as_view(), name='representative-complaint-status-update'),
    ######################################## Representative: Complaint Detail ########################################
    path('representative/complaints/<int:pk>/detail/', RepresentativeComplaintDetailView.as_view(), name='representative-complaint-detail'),
    ######################################## Representatives - Complaint Responses ########################################
    path('representative/complaints/<int:complaint_id>/responses/',RepresentativeComplaintResponseListCreateView.as_view(),
    name='representative-complaint-responses'),

    ######################################## Users ########################################
    path("user/profile/",UserProfileView.as_view(),name="user-profile"),
    path("user/change-password/",UserChangePasswordView.as_view(),name="user-change-password"),


    ######################################## myward ########################################
    path('nearby/', NearbyInfoView.as_view(), name='nearby-info'),
    path('complaints/', ComplaintCreateView.as_view(), name='complaint-create'),
    path('complaints/my/', MyComplaintsListView.as_view(), name='my-complaints'),
    path('complaints/nearby/', NearbyComplaintsView.as_view(), name='complaints-nearby'),


    ######################################## Complaint Categories ########################################
    path('complaint-categories/', ComplaintCategoryListCreateView.as_view(), name='complaint-category-list-create'),
    path('complaint-categories/<int:pk>/', ComplaintCategoryDetailView.as_view(), name='complaint-category-detail'),

    ######################################## Complaint Detail (nested) ########################################
    path('complaints/<int:pk>/detail/', ComplaintDetailView.as_view(), name='complaint-detail'),

    ######################################## Complaint Attachments ########################################
    path('complaints/<int:complaint_id>/attachments/', ComplaintAttachmentListView.as_view(), name='complaint-attachment-list'),
    path('complaints/<int:complaint_id>/attachments/upload/', ComplaintAttachmentUploadView.as_view(), name='complaint-attachment-upload'),

    ######################################## Complaint Likes ########################################
    path('complaints/like/', ComplaintLikeCreateView.as_view(), name='complaint-like'),
    path('complaints/<int:complaint_id>/unlike/', ComplaintUnlikeView.as_view(), name='complaint-unlike'),

    ######################################## Complaint Escalations ########################################
    path('complaints/escalate/', ComplaintEscalationCreateView.as_view(), name='complaint-escalate'),
    path('complaints/<int:complaint_id>/escalations/', ComplaintEscalationListView.as_view(), name='complaint-escalation-list'),

    ######################################## Complaint Feedback ########################################
    path('complaints/feedback/', ComplaintFeedbackCreateView.as_view(), name='complaint-feedback'),

    ######################################## Local Body Representatives ########################################
    path('admin/local-body-representatives/', LocalBodyRepresentativeListCreateView.as_view(), name='local-body-representative-list-create'),
    path('admin/local-body-representatives/<int:pk>/', LocalBodyRepresentativeDetailView.as_view(), name='local-body-representative-detail'),
    path('constituencies/<int:constituency_id>/local-body-representatives/', LocalBodyRepresentativesByConstituencyView.as_view(), name='local-body-representative-by-constituency'),

    ######################################## Complaint Voice Upload ########################################
    path('complaints/<int:pk>/voice-upload/', ComplaintVoiceUploadView.as_view(), name='complaint-voice-upload'),
    path('complaints/<int:pk>/voice-status/', ComplaintVoiceStatusView.as_view(), name='complaint-voice-status'),
    ######################################## Text Translation ########################################
    path('translate/', TranslateTextView.as_view(), name='translate-text'),
    path('complaints/<int:pk>/translate/', ComplaintTranslateView.as_view(), name='complaint-translate'),


    ######################################## Branch-Employee: Assigned Complaints ########################################
    path('branchemployee/complaints/', BranchEmployeeComplaintsListView.as_view(), name='branch-employee-complaints'),
    path('branchemployee/complaints/<int:pk>/', BranchEmployeeComplaintStatusUpdateView.as_view(), name='branch-employee-complaint-status-update'),
    # Branch Employee - complaint detail
    path('branchemployee/complaints/<int:pk>/detail/',BranchEmployeeComplaintDetailView.as_view(),name='branch-employee-complaint-detail'),
    # Branch Employee - response list/create
    path('branchemployee/complaints/<int:complaint_id>/responses/',BranchEmployeeComplaintResponseListCreateView.as_view(),
    name='branch-employee-complaint-responses'),
    
    path('authorities/by-district/', AuthoritiesByDistrictView.as_view(), name='authorities-by-district'),
]