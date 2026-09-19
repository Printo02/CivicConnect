from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status,generics, permissions
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import BasePermission, AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .serializers import *
from django.contrib.auth.models import User 
from .models import *
from rest_framework import generics, status, permissions
from django.shortcuts import get_object_or_404
from .utils import generate_dept_email
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView, RetrieveUpdateDestroyAPIView,DestroyAPIView,RetrieveUpdateAPIView
from rest_framework.exceptions import NotFound, PermissionDenied
from django.contrib.auth import update_session_auth_hash
from django.utils import timezone 
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.db.models import F
from .models import *
from django.db.models import Prefetch, Q
from rest_framework.pagination import PageNumberPagination
from civicconnectapp.services.voice_service import process_complaint_voice
import os
import django_rq
from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
####################################### Permission #######################################






####################################### COMMON PAGE  #######################################

# -------------------------- REGISTRATION PAGE -------------------------- #
class RegisterAPI(APIView):
    permission_classes = [AllowAny]
    def post(self,request):
        data = request.data
        serializer = RegistrationSerializers(data=data)
        if not serializer.is_valid():
            return Response({"message": serializer.errors}, status=status.HTTP_404_NOT_FOUND)

        serializer.save()
        return Response({"message": "Registered Successfully.. Please Login"}, status=status.HTTP_201_CREATED)


# -------------------------- LOGIN PAGE -------------------------- #
class LoginAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializers(data=request.data)

        if not serializer.is_valid():
            return Response({"message": serializer.errors},status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']

        try:
            role = user.profile.role or 'user'
        except UserDetail.DoesNotExist:
            role = 'user'

        refresh = RefreshToken.for_user(user)

        return Response({
                "message": "Login Successfully",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "role": role,
                "name": user.first_name,},status=status.HTTP_200_OK)

# -------------------------- District Fetch -------------------------- #
class DistrictAPI(APIView):
    def get(self,request):
        objts = District.objects.all()
        serializer = DistrictSerializer(objts,many=True)
        return Response(serializer.data)

####################################### ADMIN MODULE  #######################################

# --------------------------/ ADMIN: Profile \-------------------------- #
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        profile, _ = UserDetail.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile, _ = UserDetail.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------/ ADMIN: Change Password \-------------------------- #
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(current_password):
            return Response({'current_password': 'Current password is incorrect.'},status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


# --------------------------/ ADMIN: Fetch user details \-------------------------- #
class AdminUserViewAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        users = User.objects.filter(
            is_staff=False
        ).order_by('-date_joined')

        serializer = AdminUserViewSerializers(
            users,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )



# --------------------------/ ADMIN: User Access \-------------------------- #

class AdminUserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def patch(self, request, pk):
        user = self.get_object(pk)
        if user is None:
            return Response({"message": "User not found"},status=status.HTTP_404_NOT_FOUND)

        if "is_active" in request.data:
            user.is_active = request.data["is_active"]

        user.save()
        serializer = AdminUserViewSerializers(user)
        return Response(serializer.data,status=status.HTTP_200_OK)





# ============================================================
# ADMIN DASHBOARD - USER STATISTICS
# ============================================================

class AdminUserDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Basic user statistics
        users = User.objects.filter(is_staff=False)
        total_users = users.count()
        active_users = users.filter(is_active=True).count()
        inactive_users = users.filter(is_active=False).count()

        # New users this month
        today = timezone.now()
        month_start = today.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
        new_users_this_month = users.filter(date_joined__gte=month_start).count()

        # Role breakdown
        role_counts = (UserDetail.objects.filter(user__is_staff=False).values('role')
            .annotate(count=Count('id')).order_by('-count'))

        role_breakdown = []

        for item in role_counts:
            role_breakdown.append({
                'role': item['role'] or 'user',
                'count': item['count']
            })

        # Users without UserDetail profile
        users_without_profile = users.exclude(
            id__in=UserDetail.objects.values_list('user_id', flat=True)
        ).count()

        if users_without_profile > 0:
            role_breakdown.append({
                'role': 'user',
                'count': users_without_profile
            })

        # Monthly growth - last 6 months
        six_months_ago = today - timedelta(days=180)
        monthly_data = (users.filter(date_joined__gte=six_months_ago)
            .annotate(month=TruncMonth('date_joined')).values('month')
            .annotate(count=Count('id')).order_by('month'))

        monthly_growth = []

        for item in monthly_data:
            monthly_growth.append({'month': item['month'].strftime('%b'),
                'users': item['count']})


        # Recent users
        recent_users_queryset = users.order_by('-date_joined')[:6]

        recent_users = []

        for user in recent_users_queryset:
            profile = UserDetail.objects.filter(user=user).first()

            recent_users.append({
                'id': user.id,
                'name': user.first_name or user.username,
                'email': user.email,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'role': profile.role if profile else 'user',
                'user_profile_id': profile.id if profile else None,
            })

        # Response
        data = {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'new_users_this_month': new_users_this_month,
            'role_breakdown': role_breakdown,
            'monthly_growth': monthly_growth,
            'recent_users': recent_users,
        }

        serializer = AdminUserDashboardSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data,status=status.HTTP_200_OK)


# --------------------------/ ADMIN: List Constituency \-------------------------- #
# Pagination for List Constituency
class ConstituencyPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class ConstituencyListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Base queryset
        current_representatives = (Representative.objects.filter(is_current=True)
            .select_related("user_profile__user"))

        constituencies = (Constituency.objects.select_related("district")
            .prefetch_related(Prefetch("constituency",queryset=current_representatives,
                    to_attr="_current_representatives",)).all().order_by("name"))

        # FILTER: Government type
        constituency_type = request.query_params.get("type")

        if constituency_type:
            constituencies = constituencies.filter(type=constituency_type)

        # FILTER: District
        district = request.query_params.get("district")

        if district:
            constituencies = constituencies.filter(district_id=district)

        # SEARCH
        search = request.query_params.get("search", "").strip()

        if search:
            constituencies = constituencies.filter(
                Q(name__icontains=search) |
                Q(ward_name_no__icontains=search) |
                Q(district__dname__icontains=search) |
                Q(
                    constituency__user_profile__user__first_name__icontains=search,
                    constituency__is_current=True,
                )
            ).distinct()

        # PAGINATION
        paginator = ConstituencyPagination()
        page = paginator.paginate_queryset(constituencies,request)
        serializer = ConstituencySerializer(page,many=True)
        return paginator.get_paginated_response(serializer.data)

    # CREATE
    def post(self, request):
        serializer = ConstituencySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_201_CREATED)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)


# --------------------------/ ADMIN: View Constituency Detail \-------------------------- #
class ConstituencyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return (Constituency.objects.select_related("district").filter(id=pk).first())

    def patch(self, request, pk):
        constituency = self.get_object(pk)

        if not constituency:
            return Response({"error": "Constituency not found."},status=status.HTTP_404_NOT_FOUND)
        serializer = ConstituencySerializer(constituency,data=request.data,partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_200_OK)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        constituency = self.get_object(pk)
        if not constituency:
            return Response({"error": "Constituency not found."},status=status.HTTP_404_NOT_FOUND)
        constituency.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------/ ADMIN: View Constituency Detail \-------------------------- #
class ConstituencyTypesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        choices = [
            {
                "value": value,
                "label": label
            }
            for value, label
            in Constituency.ConstituencyType.choices
        ]
        return Response(choices,status=status.HTTP_200_OK)


# --------------------------/ ADMIN: Assign / Reassign Representative \-------------------------- #
class AssignRepresentativeView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, pk):

        if not request.user.is_staff:
            return Response({"error": "Only admins can assign representatives."},
                status=status.HTTP_403_FORBIDDEN)

        # --------------------------------------------------
        # CONSTITUENCY
        # --------------------------------------------------
        constituency = (Constituency.objects.select_related("district").filter(pk=pk).first())

        if not constituency:
            return Response({"error": "Constituency not found."},status=status.HTTP_404_NOT_FOUND)

        # --------------------------------------------------
        # NEW REPRESENTATIVE USER
        # --------------------------------------------------
        user_id = request.data.get("representative")
        if not user_id:
            return Response({"error": "Representative user is required."},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.select_related("profile").get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "Representative user not found."},status=status.HTTP_404_NOT_FOUND)

        # --------------------------------------------------
        # USER PROFILE
        # --------------------------------------------------

        try:
            user_profile = UserDetail.objects.get(user=user)
        except UserDetail.DoesNotExist:
            return Response({"error": "User profile not found."},status=status.HTTP_404_NOT_FOUND)

        # --------------------------------------------------
        # FIND REPRESENTATIVE RECORD
        # --------------------------------------------------

        new_rep = (
            Representative.objects
            .select_related("constituency")
            .filter(user_profile=user_profile)
            .first()
        )

        # --------------------------------------------------
        # PREVENT ASSIGNING SOMEONE WHO IS ALREADY
        # ASSIGNED TO ANOTHER CONSTITUENCY
        # --------------------------------------------------

        if new_rep:

            if (
                new_rep.constituency_id
                and
                new_rep.constituency_id != constituency.id
                and
                new_rep.is_current
            ):
                return Response(
                    {
                        "error":
                            f"This representative is already assigned "
                            f"to {new_rep.constituency.name}."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --------------------------------------------------
        # CURRENT REPRESENTATIVE
        # --------------------------------------------------

        current_rep = (
            Representative.objects
            .select_related("user_profile__user")
            .filter(
                constituency=constituency,
                is_current=True
            )
            .first()
        )

        # --------------------------------------------------
        # SAME REPRESENTATIVE?
        # --------------------------------------------------

        if (
            current_rep
            and
            new_rep
            and
            current_rep.id == new_rep.id
        ):
            return Response(
                {
                    "error":
                        "This representative is already assigned "
                        "to this constituency."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------------------------
        # DEACTIVATE OLD REPRESENTATIVE
        # --------------------------------------------------

        if current_rep:

            old_profile = current_rep.user_profile
            old_user = old_profile.user

            current_rep.constituency = None
            current_rep.is_current = False
            current_rep.end_date = timezone.now().date()

            current_rep.save(
                update_fields=[
                    "constituency",
                    "is_current",
                    "end_date",
                    "updated_at",
                ]
            )

            # Old representative becomes normal user
            old_profile.role = "user"
            old_profile.save(
                update_fields=["role"]
            )

            # IMPORTANT:
            # Disable the old login account
            old_user.is_active = False
            old_user.save(
                update_fields=["is_active"]
            )

        # --------------------------------------------------
        # ASSIGN NEW REPRESENTATIVE
        # --------------------------------------------------
        if new_rep:
            new_rep.constituency = constituency
            new_rep.is_current = True
            new_rep.start_date = timezone.now().date()
            new_rep.end_date = None

            new_rep.save(
                update_fields=[
                    "constituency",
                    "is_current",
                    "start_date",
                    "end_date",
                    "updated_at",
                ]
            )
            representative = new_rep

        else:
            representative = Representative.objects.create(user_profile=user_profile,constituency=constituency,
                start_date=timezone.now().date(),is_current=True)

        # --------------------------------------------------
        # ACTIVATE NEW REPRESENTATIVE ACCOUNT
        # --------------------------------------------------
        user_profile.role = "representative"
        user_profile.save(update_fields=["role"])

        user.is_active = True
        user.save(update_fields=["is_active"])

        # --------------------------------------------------
        # RESPONSE
        # --------------------------------------------------
        constituency.refresh_from_db()
        return Response(ConstituencySerializer(constituency).data,status=status.HTTP_200_OK)


# --------------------------/ ADMIN: List Representative \-------------------------- #
class RepresentativeListCreateView(generics.ListCreateAPIView):
    queryset = Representative.objects.select_related(
        "user_profile__user", "constituency", "constituency__district"
    ).all().order_by("-updated_at")
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AddRepresentativeSerializer
        return RepresentativeSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        representative = serializer.save()
        output = RepresentativeSerializer(representative, context={"request": request})
        data = output.data
        data["generated_email"] = getattr(representative, "generated_email", None)
        return Response(data, status=status.HTTP_201_CREATED)


# --------------------------/ ADMIN: View Representative Detail \-------------------------- #
class RepresentativeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Representative.objects.select_related("user_profile__user","constituency","constituency__district")
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return RepresentativeAdminUpdateSerializer

        return RepresentativeSerializer

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)

        if request.method in ("PUT", "PATCH", "DELETE"):
            if not request.user.is_staff:
                raise PermissionDenied("Only admins can modify representatives.")

    def perform_destroy(self, instance):
        user_profile = instance.user_profile
        user = user_profile.user
        user.is_active = False
        user.save(update_fields=["is_active"])
        user_profile.role = "user"
        user_profile.save(update_fields=["role"])

        instance.is_current = False
        instance.end_date = (instance.end_date or timezone.now().date())
        instance.constituency = None

        instance.save(
            update_fields=[
                "is_current",
                "end_date",
                "constituency",
                "updated_at",
            ]
        )

# --------------------------/ ADMIN: Available Representatives \-------------------------- #
class AvailableRepresentativeUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Only admins can view available representatives."},
                status=status.HTTP_403_FORBIDDEN
            )

        representatives = (Representative.objects.filter(constituency__isnull=True,
                is_current=True,user_profile__role="representative",
                user_profile__user__is_active=True,user_profile__user__is_staff=False,
            ).select_related("user_profile__user").order_by("user_profile__user__first_name"))

        data = []

        for representative in representatives:
            user = representative.user_profile.user
            data.append({
                "representative_id": representative.id,
                "user_profile_id": representative.user_profile.id,
                "user_id": user.id,
                "name": user.get_full_name() or user.first_name,
                "email": user.email,
                "is_active": user.is_active,
            })

        return Response(data,status=status.HTTP_200_OK)


# --------------------------/  ADMIN: Toggle Representative Active Status  \-------------------------- #
class RepresentativeStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        representative = Representative.objects.filter(pk=pk).select_related("user_profile__user").first()
        if not representative:
            return Response({"error": "Representative not found."}, status=status.HTTP_404_NOT_FOUND)

        if "is_active" not in request.data and "is_current" not in request.data:
            return Response({"error": "is_active is required."}, status=status.HTTP_400_BAD_REQUEST)

        active = bool(request.data.get("is_active", request.data.get("is_current")))
        representative.is_current = active
        if not active and not representative.end_date:
            representative.end_date = timezone.now().date()
        representative.save(update_fields=["is_current", "end_date", "updated_at"])

        profile = representative.user_profile
        profile.role = "representative" if active else "user"
        profile.save(update_fields=["role"])
        profile.user.is_active = active
        profile.user.save(update_fields=["is_active"])
        return Response(RepresentativeSerializer(representative).data, status=status.HTTP_200_OK)


# --------------------------/ ADMIN: View Representatives by Constituency \-------------------------- #
class RepresentativesByConstituencyView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, constituency_id):
        representative = (Representative.objects.select_related("user_profile__user","constituency","constituency__district")
            .filter(constituency_id=constituency_id,is_current=True).first())
        if not representative:
            return Response(None,status=status.HTTP_200_OK)
        return Response(RepresentativeSerializer(representative).data,status=status.HTTP_200_OK)


# --------------------------/ ADMIN: Add Department \-------------------------- #
class AddDepartmentAPIView(CreateAPIView):
    queryset = Dept.objects.all()
    serializer_class = AddDepartmentSerializer
    permission_classes = [IsAuthenticated]


# --------------------------/ ADMIN: List Department \-------------------------- #
class DepartmentListAPIView(ListAPIView):
    queryset = Dept.objects.select_related("user_profile__user").all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]


# --------------------------/ ADMIN: Department Details/View \-------------------------- #
class DepartmentDetailAPIView(RetrieveAPIView):
    queryset = Dept.objects.select_related("user_profile__user").all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]


# --------------------------/ ADMIN: Delete Department  \-------------------------- #
class DeleteDepartmentAPI(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        try:
            dept = Dept.objects.select_related("user_profile__user").get(pk=pk)
        except Dept.DoesNotExist:
            return Response({"detail": "Department not found."},status=status.HTTP_404_NOT_FOUND)

        user_detail = dept.user_profile
        user = user_detail.user
        dept.delete()
        user_detail.delete()
        user.delete()

        return Response({"detail": "Department, UserDetail and User account deleted successfully."},status=status.HTTP_200_OK)



# --------------------------/ ADMIN: Branches by Department  \-------------------------- #
class AdminDepartmentBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            department = Dept.objects.get(pk=pk)
        except Dept.DoesNotExist:
            return Response({"message": "Department not found."},status=status.HTTP_404_NOT_FOUND)
        branches = (
            Branch.objects.filter(deptid=department).select_related("deptid", "district").order_by("-created_at"))

        serializer = AdminBranchSerializer(branches,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)



# --------------------------/ ADMIN: Branch Employee by Branches   \-------------------------- #
class AdminBranchEmployeesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        try:
            branch = Branch.objects.get(pk=pk)
        except Branch.DoesNotExist:
            return Response({"message": "Branch not found."},status=status.HTTP_404_NOT_FOUND)

        employees = (BranchEmployees.objects.filter(branch_details=branch)
            .select_related("user_details", "branch_details").order_by("-id"))

        serializer = AdminBranchEmployeeSerializer(employees,many=True)

        return Response(serializer.data,status=status.HTTP_200_OK)




####################################### DEPT MODULE #######################################
# --------------------------/ DEPT: Profile \-------------------------- #
class DeptProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser,MultiPartParser,FormParser]
    
    def get(self, request):
        try:
            dept = Dept.objects.select_related("user_profile__user").get(user_profile__user=request.user)
        except Dept.DoesNotExist:
            return Response({"detail": "Department profile not found."},status=status.HTTP_404_NOT_FOUND)
        serializer = DeptProfileSerializer(dept)
        return Response(serializer.data)
    
    def patch(self, request):
        try:
            dept = Dept.objects.select_related("user_profile__user").get(user_profile__user=request.user)
        except Dept.DoesNotExist:
            return Response({"detail": "Department profile not found."},status=status.HTTP_404_NOT_FOUND)
        serializer = DeptProfileSerializer(dept,data=request.data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_200_OK)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)


# --------------------------/ DEPT: Change Password  \-------------------------- #
class DeptChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(current_password):
            return Response({'current_password': 'Current password is incorrect.'},status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)

# --------------------------/ DEPT: Add Branch \-------------------------- #
class DeptAddBranchAPIView(CreateAPIView):
    queryset = Branch.objects.all()
    serializer_class = DeptAddBranchSerializer
    permission_classes = [IsAuthenticated]


# --------------------------/ DEPT: List Branch \-------------------------- #
class DeptBranchListAPIView(ListAPIView):
    serializer_class = DeptBranchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Branch.objects.filter(deptid__user_profile__user=self.request.user)


# --------------------------/ DEPT: View Branch Detail \-------------------------- #
class DeptBranchDetailAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = DeptEditBranchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Branch.objects.filter(deptid__user_profile__user=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        branch = queryset.filter(pk=self.kwargs["pk"]).first()
        if not branch:
            raise NotFound("Branch not found or you do not have access to it.")
        return branch

    def perform_destroy(self, instance):
        user_detail = instance.user_details
        user = user_detail.user if user_detail else None
        instance.delete()
        if user_detail:
            user_detail.delete()
        if user:
            user.delete()


####################################### BRANCH-EMPLOYEE MODULE (sub-module of DEPT) #######################################











####################################### BRANCH MODULE (sub-module of DEPT) #######################################

# --------------------------/ BRANCH: Profile \-------------------------- #
class BranchProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser,MultiPartParser,FormParser]

    def get(self, request):
        try:
            branch = Branch.objects.select_related("user_details__user").get(user_details__user=request.user)
        except Branch.DoesNotExist:
            return Response({"detail": "Branch profile not found."},status=status.HTTP_404_NOT_FOUND)
        serializer = BranchProfileSerializer(branch)
        return Response(serializer.data)

    def patch(self, request):
        try:
            branch = Branch.objects.select_related("user_details__user").get(user_details__user=request.user)
        except Branch.DoesNotExist:
            return Response({"detail": "Branch profile not found."},status=status.HTTP_404_NOT_FOUND)
        serializer = BranchProfileSerializer(branch,data=request.data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_200_OK)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)


# --------------------------/ BRANCH: Change Password \-------------------------- #
class BranchChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BranchChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        user = request.user

        current_password = serializer.validated_data["current_password"]

        new_password = serializer.validated_data["new_password"]

        if not user.check_password(current_password):
            return Response({"current_password":"Current password is incorrect."},status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({"message":"Password updated successfully."},status=status.HTTP_200_OK)




# --------------------------/ BRANCH: add branch employee \-------------------------- #
class BranchAddEmployeeAPIView(CreateAPIView):
    serializer_class = AddBranchEmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_branch(self):
        try:
            user_detail = UserDetail.objects.get(user=self.request.user)
            branch = Branch.objects.get(user_details=user_detail)
            return branch
        except UserDetail.DoesNotExist:
            raise PermissionDenied("User profile not found.")

        except Branch.DoesNotExist:
            raise PermissionDenied("You are not assigned to a branch.")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["branch"] = self.get_branch()
        return context


# --------------------------/ BRANCH: List Employee \-------------------------- #
class BranchEmployeesAPIView(ListAPIView):
    serializer_class = AddBranchEmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BranchEmployees.objects.filter(branch_details__user_details__user=self.request.user
    ).select_related("user_details", "branch_details")

# --------------------------/ BRANCH: Delete Employee \-------------------------- #
class BranchDeleteEmployeeAPIView(DestroyAPIView):
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        try:
            user_detail = UserDetail.objects.get(user=self.request.user)
            branch = Branch.objects.get(user_details=user_detail)
            return BranchEmployees.objects.filter(branch_details=branch)

        except (UserDetail.DoesNotExist,Branch.DoesNotExist):
            return BranchEmployees.objects.none()


####################################### USER MODULE #######################################

# --------------------------/ USER: Profile \-------------------------- #
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            profile = UserDetail.objects.select_related("user").get(user=request.user)
        except UserDetail.DoesNotExist:
            return Response({"detail": "User profile not found."},status=status.HTTP_404_NOT_FOUND)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data,status=status.HTTP_200_OK)

    def patch(self, request):
        try:
            profile = UserDetail.objects.get(user=request.user)
        except UserDetail.DoesNotExist:
            return Response({"detail": "User profile not found."},status=status.HTTP_404_NOT_FOUND)
        serializer = UserProfileSerializer(profile,data=request.data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_200_OK)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)


# --------------------------/ USER: Change Password \-------------------------- #
class UserChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = UserChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        
        current_password = serializer.validated_data["current_password"]
        new_password = serializer.validated_data["new_password"]
        
        if not user.check_password(current_password):
            return Response({"current_password":"Current password is incorrect."},status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        update_session_auth_hash(request, user)
        
        return Response({"message":"Password changed successfully."},status=status.HTTP_200_OK)




####################################### REPRESENTATIVE MODULE #######################################
# --------------------------/ REP: Profile \-------------------------- #
class RepresentativeProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [ MultiPartParser,FormParser ]

    def get(self, request):
        try:
            representative = Representative.objects.select_related("user_profile__user","constituency").get(
                user_profile__user=request.user)
        except Representative.DoesNotExist:
            return Response({"detail":"Representative profile not found."},status=status.HTTP_404_NOT_FOUND)

        serializer = RepresentativeProfileSerializer(representative)
        return Response(serializer.data,status=status.HTTP_200_OK)

    def patch(self, request):
        try:
            representative = Representative.objects.get(user_profile__user=request.user)
        except Representative.DoesNotExist:
            return Response({"detail":"Representative profile not found."},status=status.HTTP_404_NOT_FOUND)

        serializer = RepresentativeProfileSerializer(representative,data=request.data,partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_200_OK)

        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)



# --------------------------/ REP: Change Password \-------------------------- #
class RepresentativeChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = RepresentativeChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        
        current_password = serializer.validated_data["current_password"]
        new_password = serializer.validated_data["new_password"]
        
        if not user.check_password(current_password):
            return Response({"current_password":"Current password is incorrect."},status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        update_session_auth_hash(request, user)
        return Response({"message":"Password changed successfully."},status=status.HTTP_200_OK)


# --------------------------/ REP: View Constituency Details  \-------------------------- #
class RepresentativeConstituencyView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            representative = Representative.objects.select_related("constituency","constituency__district").get(
                user_profile__user=request.user)
        except Representative.DoesNotExist:
            return Response({"detail": "Representative profile not found."},status=status.HTTP_404_NOT_FOUND)
        serializer = RepresentativeConstituencySerializer(representative)
        return Response(serializer.data,status=status.HTTP_200_OK)


# --------------------------/ REPRESENTATIVE: View Assigned Complaints \-------------------------- #
class RepresentativeComplaintsListView(ListAPIView):
    serializer_class = ComplaintListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (Complaint.objects.filter(representative__user_profile__user=self.request.user)
                .select_related("representative").order_by("-created_at"))



# --------------------------/ REPRESENTATIVE: Update Complaint Status \-------------------------- #
class RepresentativeComplaintStatusUpdateView(RetrieveUpdateDestroyAPIView):
    serializer_class = ComplaintStatusUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Complaint.objects.filter(representative__user_profile__user=self.request.user)



####################################### BRANCH-EMPLOYEE MODULE #######################################
# --------------------------/ BRANCH-EMPLOYEE: Profile \-------------------------- #
class BranchEmployeeProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            profile = (BranchEmployees.objects.select_related("user_details","branch_details",
                    "branch_details__deptid").get(user_details=request.user))
        except BranchEmployees.DoesNotExist:
            return Response({"detail": "Branch employee profile not found."},status=status.HTTP_404_NOT_FOUND)
        serializer = BranchEmployeeProfileSerializer(profile)
        return Response(serializer.data,status=status.HTTP_200_OK)

    def patch(self, request):
        try:
            profile = (BranchEmployees.objects.select_related("user_details","branch_details",
                    "branch_details__deptid").get(user_details=request.user))

        except BranchEmployees.DoesNotExist:
            return Response({"detail": "Branch employee profile not found."},status=status.HTTP_404_NOT_FOUND)
        serializer = BranchEmployeeProfileSerializer(profile,data=request.data,partial=True)

        
        if serializer.is_valid():
            serializer.save()
            profile.refresh_from_db()
            return Response(BranchEmployeeProfileSerializer(profile).data,status=status.HTTP_200_OK)

        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)


# --------------------------/ BRANCH-EMPLOYEE: Change Password \-------------------------- #
class BranchEmployeeChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BranchEmployeeChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        current_password = serializer.validated_data["current_password"]

        new_password = serializer.validated_data["new_password"]

        # Verify current password
        if not user.check_password(current_password):
            return Response({"current_password":"Current password is incorrect."},status=status.HTTP_400_BAD_REQUEST)

        # Change password
        user.set_password(new_password)
        user.save(update_fields=["password"])
        update_session_auth_hash(request, user)
        return Response({"message": "Password changed successfully."},status=status.HTTP_200_OK)




####################################### LOCATION-BASED LOOKUP (CITIZEN) #######################################

# --------------------------/ USER: Nearby Representatives & Branches \-------------------------- #
class NearbyInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")

        if not lat or not lng:
            return Response({"error": "lat and lng query parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lat = float(lat)
            lng = float(lng)
        except ValueError:
            return Response({"error": "lat and lng must be valid numbers."}, status=status.HTTP_400_BAD_REQUEST)

        user_point = Point(lng, lat, srid=4326)
        matching_constituencies = Constituency.objects.filter(boundary__contains=user_point, is_active=True)

        representatives = (Representative.objects.filter(constituency__in=matching_constituencies, is_current=True)
            .select_related("user_profile__user", "constituency", "constituency__district"))
        radius_km = float(request.query_params.get("radius_km", 15))
        nearby_branches = (Branch.objects.filter(location_point__distance_lte=(user_point, D(km=radius_km)), is_active=True)
            .annotate(distance=Distance("location_point", user_point))
            .select_related("district", "deptid").order_by("distance")[:10])

        return Response({"representatives": NearbyRepresentativeSerializer(representatives, many=True).data,
            "branches": NearbyBranchSerializer(nearby_branches, many=True).data,}, status=status.HTTP_200_OK)


####################################### COMPLAINT MODULE #######################################

# --------------------------/ USER: File Complaint \-------------------------- #
class ComplaintCreateView(CreateAPIView):
    serializer_class = ComplaintCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


# --------------------------/ USER: My Complaints \-------------------------- #
class MyComplaintsListView(ListAPIView):
    serializer_class = ComplaintListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Complaint.objects.filter(citizen=self.request.user).select_related("branch").order_by("-created_at")


# --------------------------/ BRANCH: View Assigned Complaints \-------------------------- #
class BranchComplaintsListView(ListAPIView):
    serializer_class = ComplaintListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (Complaint.objects.filter(branch__user_details__user=self.request.user)
                .select_related("branch").order_by("-created_at"))


# --------------------------/ BRANCH: Update Complaint Status \-------------------------- #

class ComplaintStatusUpdateView(RetrieveUpdateAPIView):
    serializer_class = ComplaintStatusUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Complaint.objects.filter(branch__user_details__user=self.request.user)

# -------------------------

class BranchEmployeeStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_branch(self, request):
        try:
            user_detail = UserDetail.objects.get(user=request.user)
            return Branch.objects.get(user_details=user_detail)
        except (UserDetail.DoesNotExist, Branch.DoesNotExist):
            return None

    @transaction.atomic
    def patch(self, request, pk):
        branch = self.get_branch(request)

        if not branch:
            return Response({"detail": "Branch account not found."},status=status.HTTP_404_NOT_FOUND)

        try:
            employee = (BranchEmployees.objects.select_related("user_details").get(pk=pk,branch_details=branch))
        except BranchEmployees.DoesNotExist:
            return Response({"detail": "Employee not found."},status=status.HTTP_404_NOT_FOUND)
        is_active = request.data.get("is_active")

        if not isinstance(is_active, bool):
            return Response({"is_active": "A boolean value is required."},status=status.HTTP_400_BAD_REQUEST)

        # BranchEmployees status
        employee.is_active = is_active
        employee.save(update_fields=["is_active"])

        # Django auth_user status
        user = employee.user_details
        user.is_active = is_active
        user.save(update_fields=["is_active"])

        return Response({"id": employee.id,"is_active": employee.is_active,
                "account_is_active": user.is_active,
                "detail": ("Employee activated successfully."
                    if is_active
                    else "Employee deactivated successfully.")},status=status.HTTP_200_OK)


####################################### COMPLAINT CATEGORY #######################################

# --------------------------/ Complaint Categories: List (all) / Create (admin) \-------------------------- #
class ComplaintCategoryListCreateView(APIView):
    """
    GET is open to any authenticated user (citizens need this to pick a
    category when filing a complaint). POST is admin-only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = ComplaintCategory.objects.filter(is_active=True).order_by("name")
        serializer = ComplaintCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if not request.user.is_staff:
            raise PermissionDenied("Only admins can create complaint categories.")
        serializer = ComplaintCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------/ Complaint Categories: Detail (admin) \-------------------------- #
class ComplaintCategoryDetailView(RetrieveUpdateDestroyAPIView):
    queryset = ComplaintCategory.objects.all()
    serializer_class = ComplaintCategorySerializer
    permission_classes = [IsAuthenticated]

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method in ("PUT", "PATCH", "DELETE") and not request.user.is_staff:
            raise PermissionDenied("Only admins can modify complaint categories.")


####################################### COMPLAINT DETAIL (nested) #######################################
def _user_can_view_complaint(user, complaint):
    if user.is_staff:
        return True
    if complaint.citizen_id == user.id:
        return True
    if complaint.branch and complaint.branch.user_details.user_id == user.id:
        return True
    if complaint.representative and complaint.representative.user_profile.user_id == user.id:
        return True
    if complaint.local_body_representative and complaint.local_body_representative.user_profile.user_id == user.id:
        return True
    return False


# --------------------------/ Complaint: Full Detail (nested) \-------------------------- #
class ComplaintDetailView(RetrieveAPIView):
    serializer_class = ComplaintDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (Complaint.objects.select_related(
                "citizen","category","branch","representative","representative__user_profile",
                "representative__user_profile__user",
                "local_body_representative","constituency",
                "assigned_employee","assigned_employee__user_details").prefetch_related("attachments",
                    "translations","escalations","feedback",
                    "likes","responses","responses__attachments"
                ))

    def get_object(self):
        complaint = get_object_or_404(self.get_queryset(), pk=self.kwargs["pk"])
        if not _user_can_view_complaint(self.request.user, complaint):
            raise PermissionDenied("You do not have access to this complaint.")
        return complaint

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Atomic increment avoids race conditions from concurrent viewers
        Complaint.objects.filter(pk=instance.pk).update(view_count=F("view_count") + 1)
        instance.refresh_from_db(fields=["view_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


####################################### COMPLAINT ATTACHMENTS #######################################

# --------------------------/ USER: Upload Attachment \-------------------------- #
class ComplaintAttachmentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint,pk=complaint_id)

        # Ownership check
        if complaint.citizen_id != request.user.id:
            raise PermissionDenied("You can only attach files to your own complaint.")

        serializer = ComplaintAttachmentSerializer(data=request.data,context={"request": request})

        if not serializer.is_valid():
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

        attachment = serializer.save(complaint=complaint,uploaded_by=request.user)
        return Response(ComplaintAttachmentSerializer(attachment,
                context={"request": request}).data,status=status.HTTP_201_CREATED)





# --------------------------/ List Attachments for a Complaint \-------------------------- #
class ComplaintAttachmentListView(ListAPIView):
    serializer_class = ComplaintAttachmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        complaint = get_object_or_404(Complaint, pk=self.kwargs["complaint_id"])
        if not _user_can_view_complaint(self.request.user, complaint):
            raise PermissionDenied("You do not have access to this complaint.")
        return complaint.attachments.all()


####################################### COMPLAINT LIKES #######################################

# --------------------------/ USER: Like a Complaint \-------------------------- #
class ComplaintLikeCreateView(CreateAPIView):
    serializer_class = ComplaintLikeSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        complaint = serializer.validated_data.get("complaint")
        # Design choice: citizens cannot like/support their own complaint.
        if complaint and complaint.citizen_id == self.request.user.id:
            raise PermissionDenied("You cannot support your own complaint.")
        serializer.save()


# --------------------------/ USER: Unlike a Complaint \-------------------------- #
class ComplaintUnlikeView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, complaint_id):
        like = ComplaintLike.objects.filter(complaint_id=complaint_id, user=request.user).first()
        if not like:
            return Response({"detail": "You have not supported this complaint."}, status=status.HTTP_404_NOT_FOUND)
        like.delete()
        Complaint.objects.filter(pk=complaint_id).update(like_count=F("like_count") - 1)
        return Response(status=status.HTTP_204_NO_CONTENT)


####################################### COMPLAINT ESCALATIONS #######################################

# --------------------------/ USER: Escalate a Complaint \-------------------------- #
class ComplaintEscalationCreateView(CreateAPIView):
    serializer_class = ComplaintEscalationSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        complaint = serializer.validated_data.get("complaint")
        if complaint and complaint.citizen_id != self.request.user.id:
            raise PermissionDenied("You can only escalate your own complaint.")
        serializer.save()


# --------------------------/ List Escalations for a Complaint (owner / staff) \-------------------------- #
class ComplaintEscalationListView(ListAPIView):
    serializer_class = ComplaintEscalationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        complaint = get_object_or_404(Complaint, pk=self.kwargs["complaint_id"])
        if not _user_can_view_complaint(self.request.user, complaint):
            raise PermissionDenied("You do not have access to this complaint.")
        return complaint.escalations.all().order_by("-created_at")


####################################### COMPLAINT FEEDBACK #######################################

# --------------------------/ USER: Submit Feedback \-------------------------- #
class ComplaintFeedbackCreateView(CreateAPIView):
    serializer_class = ComplaintFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        complaint = serializer.validated_data.get("complaint")
        if complaint and complaint.citizen_id != self.request.user.id:
            raise PermissionDenied("You can only leave feedback on your own complaint.")
        serializer.save()


####################################### LOCAL BODY REPRESENTATIVE #######################################

# --------------------------/ ADMIN: List / Create Local Body Representatives \-------------------------- #
class LocalBodyRepresentativeListCreateView(generics.ListCreateAPIView):
    queryset = (
        LocalBodyRepresentative.objects.select_related(
            "user_profile__user", "constituency", "constituency__district"
        ).order_by("-updated_at")
    )
    serializer_class = LocalBodyRepresentativeSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            raise PermissionDenied("Only admins can assign local body representatives.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        representative = serializer.save()

        user_profile = representative.user_profile
        user_profile.role = "local_body_representative"
        user_profile.save(update_fields=["role"])

        output = LocalBodyRepresentativeSerializer(representative)
        return Response(output.data, status=status.HTTP_201_CREATED)


# --------------------------/ ADMIN: Local Body Representative Detail \-------------------------- #
class LocalBodyRepresentativeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LocalBodyRepresentative.objects.select_related(
        "user_profile__user", "constituency", "constituency__district")
    serializer_class = LocalBodyRepresentativeSerializer
    permission_classes = [IsAuthenticated]

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method in ("PUT", "PATCH", "DELETE") and not request.user.is_staff:
            raise PermissionDenied("Only admins can modify local body representatives.")

    def perform_destroy(self, instance):
        user_profile = instance.user_profile
        user_profile.role = "user"
        user_profile.save(update_fields=["role"])
        instance.delete()


# --------------------------/ Local Body Representatives by Constituency (public lookup) \-------------------------- #
class LocalBodyRepresentativesByConstituencyView(ListAPIView):
    serializer_class = LocalBodyRepresentativeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            LocalBodyRepresentative.objects.filter(
                constituency_id=self.kwargs["constituency_id"], is_current=True
            ).select_related("user_profile__user", "constituency", "constituency__district")
        )



####################################### NEARBY COMPLAINTS #######################################

# --------------------------/ USER: Nearby Complaints (separate from NearbyInfoView) \-------------------------- #
class NearbyComplaintsView(APIView):
    """
    Finds Complaint objects within a radius of a point, e.g. for an
    'issues near me' feed. Distinct from NearbyInfoView, which surfaces
    representatives/branches rather than complaints.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")

        if not lat or not lng:
            return Response({"error": "lat and lng query parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lat = float(lat)
            lng = float(lng)
        except ValueError:
            return Response({"error": "lat and lng must be valid numbers."}, status=status.HTTP_400_BAD_REQUEST)

        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            return Response({"error": "lat/lng out of valid range."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            radius_km = float(request.query_params.get("radius_km", 5))
        except ValueError:
            return Response({"error": "radius_km must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

        if not (0 < radius_km <= 100):
            return Response({"error": "radius_km must be between 0 and 100."}, status=status.HTTP_400_BAD_REQUEST)

        user_point = Point(lng, lat, srid=4326)

        complaints = (
            Complaint.objects.filter(location_point__isnull=False)
            .filter(location_point__distance_lte=(user_point, D(km=radius_km)))
            .annotate(distance=Distance("location_point", user_point))
            .select_related("branch", "representative__user_profile__user", "category")
            .order_by("distance")[:50]
        )

        return Response(ComplaintListSerializer(complaints, many=True).data, status=status.HTTP_200_OK)


####################################### VOICE UPLOAD #######################################
# --------------------------/ USER: Upload Voice Input for a Complaint \-------------------------- #
####################################### COMPLAINT VOICE UPLOAD & STATUS #######################################

# --------------------------/ USER: Upload Voice Input for a Complaint \-------------------------- #
class ComplaintVoiceUploadView(APIView):
    """
    Uploads audio and enqueues background processing.
    Returns HTTP 202 Accepted immediately without waiting.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    ALLOWED_AUDIO_TYPES = {
        "audio/mpeg",
        "audio/wav",
        "audio/x-wav",
        "audio/mp4",
        "audio/webm",
        "audio/ogg",
        "audio/aac",
    }

    ALLOWED_EXTENSIONS = {
        ".mp3",
        ".wav",
        ".mp4",
        ".webm",
        ".ogg",
        ".aac",
        ".m4a",
    }

    MAX_AUDIO_SIZE = 15 * 1024 * 1024  # 15 MB

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)

        if complaint.citizen_id != request.user.id:
            raise PermissionDenied("You can only attach voice input to your own complaint.")

        audio_file = request.FILES.get("audio_file")

        if not audio_file:
            return Response({"audio_file": "An audio file is required."},status=status.HTTP_400_BAD_REQUEST)

        if audio_file.size > self.MAX_AUDIO_SIZE:
            return Response(
                {"audio_file": "Audio file must be under 15MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file_extension = os.path.splitext(audio_file.name)[1].lower()
        content_type = (audio_file.content_type or "").lower()

        if file_extension not in self.ALLOWED_EXTENSIONS:
            return Response(
                {
                    "audio_file": (
                        f"Unsupported file extension: {file_extension}. "
                        f"Allowed: {', '.join(sorted(self.ALLOWED_EXTENSIONS))}"
                    )
                },status=status.HTTP_400_BAD_REQUEST)

        if (content_type not in self.ALLOWED_AUDIO_TYPES and 
            content_type != "application/octet-stream"):
            return Response({"audio_file": (
                        f"Unsupported audio type: {content_type}"
                    )
                },status=status.HTTP_400_BAD_REQUEST)

        voice_language = request.data.get("voice_language", "ml")

        if voice_language not in ("en", "ml"):
            return Response({"voice_language": "Must be 'en' or 'ml'."},
                status=status.HTTP_400_BAD_REQUEST)

        # Save audio on Complaint
        with transaction.atomic():

            complaint.audio_file = audio_file
            complaint.voice_language = voice_language
            complaint.original_language = voice_language
            complaint.voice_processing_status = (Complaint.VoiceProcessingStatus.PENDING)

            complaint.save(
                update_fields=[
                    "audio_file",
                    "voice_language",
                    "original_language",
                    "voice_processing_status",
                    "updated_at",
                ]
            )

            ComplaintAttachment.objects.create(
                complaint=complaint,
                file=complaint.audio_file.name,
                file_type=ComplaintAttachment.FileType.AUDIO,
                original_filename=audio_file.name,
                file_size=audio_file.size,
                mime_type=(audio_file.content_type or "application/octet-stream"),
                uploaded_by=request.user)

        # Enqueue background job
        try:
            queue = django_rq.get_queue("voice")
            queue.enqueue(
                process_complaint_voice,
                complaint.id,
                job_timeout=180,
                result_ttl=300,
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).exception(
                "Failed to enqueue voice processing for complaint %s", complaint.id
            )

        return Response({
                "message": "Voice input received. Processing in the background.",
                "id": complaint.id,
                "audio_file": (complaint.audio_file.url 
                    if complaint.audio_file
                    else None
                ),
                "voice_language": complaint.voice_language,
                "original_language": complaint.original_language,
                "voice_processing_status": complaint.voice_processing_status,
            },status=status.HTTP_202_ACCEPTED)


# --------------------------/ USER: Check Voice Processing Status \-------------------------- #
class ComplaintVoiceStatusView(APIView):
    """Poll voice processing status"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)

        if complaint.citizen_id != request.user.id:
            raise PermissionDenied("You can only check status on your own complaint.")
        return Response(ComplaintVoiceStatusSerializer(complaint).data,status=status.HTTP_200_OK,)



####################################### TEXT TRANSLATION #######################################
# --------------------------/ USER: Translate arbitrary text (en <-> ml) \-------------------------- #
class TranslateTextView(APIView):
    """
    Stand-alone text translation using the IndicTrans2 models already
    wired up in civicconnectapp/services/voice_service.py. Does not touch
    audio, Whisper, or NeMo -- safe to use while the voice/STT path is
    still being set up on the dev machine.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TranslateTextSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        from civicconnectapp.services.voice_service import translate_text

        text = serializer.validated_data["text"]
        source_language = serializer.validated_data["source_language"]
        target_language = serializer.validated_data["target_language"]

        try:
            translated = translate_text(text, source_language, target_language)
        except Exception:
            return Response(
                {"detail": "Translation failed. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "source_language": source_language,
                "target_language": target_language,
                "original_text": text,
                "translated_text": translated,
            },
            status=status.HTTP_200_OK,
        )


# --------------------------/ Translate an existing Complaint (text-filed, no audio) \-------------------------- #
class ComplaintTranslateView(APIView):
    """
    For complaints filed as plain text (no voice upload): generates and
    stores the missing-language ComplaintTranslation row on demand, using
    the same IndicTrans2 pipeline the voice pathway uses. Reuses the
    _user_can_view_complaint() check already defined above.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)

        if not _user_can_view_complaint(request.user, complaint):
            raise PermissionDenied("You do not have access to this complaint.")

        source_language = complaint.original_language or "en"
        target_language = "ml" if source_language == "en" else "en"

        existing = complaint.translations.filter(language=target_language).first()
        if existing:
            return Response(ComplaintTranslationSerializer(existing).data, status=status.HTTP_200_OK)

        from civicconnectapp.services.voice_service import translate_text

        try:
            translated_title = translate_text(complaint.title, source_language, target_language)
            translated_description = translate_text(complaint.description or "", source_language, target_language)
        except Exception:
            return Response(
                {"detail": "Translation failed. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        translation, _ = ComplaintTranslation.objects.update_or_create(
            complaint=complaint,
            language=target_language,
            defaults={
                "title": translated_title[:255],
                "description": translated_description,
                "translated_by": "indictrans2",
            },
        )

        return Response(ComplaintTranslationSerializer(translation).data, status=status.HTTP_201_CREATED)
    
    




####################################### BRANCH: ASSIGN COMPLAINT TO EMPLOYEE #######################################

# --------------------------/ BRANCH: Assign a complaint to one of its employees \-------------------------- #
class BranchAssignComplaintView(APIView):
    """
    Branch admin hands off a complaint filed against their branch to a
    specific BranchEmployees record. Only employees on that same branch's
    roster are valid targets. First assignment auto-bumps PENDING -> IN_PROGRESS.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            branch = Branch.objects.get(user_details__user=request.user)
        except Branch.DoesNotExist:
            raise PermissionDenied("You are not assigned to a branch.")

        complaint = get_object_or_404(Complaint, pk=pk, branch=branch)

        serializer = ComplaintAssignEmployeeSerializer(
            complaint, data=request.data, partial=True,
            context={"request": request, "branch": branch},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


# --------------------------/ BRANCH: List employees eligible for assignment \-------------------------- #
class BranchAssignableEmployeesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            branch = Branch.objects.get(user_details__user=request.user)
        except Branch.DoesNotExist:
            raise PermissionDenied("You are not assigned to a branch.")

        employees = (BranchEmployees.objects.filter(branch_details=branch,user_details__is_active=True).select_related("user_details"))

        serializer = AddBranchEmployeeSerializer(employees,many=True)

        return Response(serializer.data,status=status.HTTP_200_OK)

####################################### BRANCH-EMPLOYEE: ASSIGNED COMPLAINTS #######################################
# --------------------------/ BRANCH-EMPLOYEE: My Assigned Complaints \-------------------------- #
class BranchEmployeeComplaintsListView(ListAPIView):
    serializer_class = ComplaintListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (Complaint.objects.filter(assigned_employee__user_details=self.request.user)
            .select_related("branch", "assigned_employee").order_by("-created_at"))


# --------------------------/ BRANCH-EMPLOYEE: Update Status on Assigned Complaint \-------------------------- #
class BranchEmployeeComplaintStatusUpdateView(RetrieveUpdateAPIView):
    serializer_class = ComplaintStatusUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Complaint.objects.filter(assigned_employee__user_details=self.request.user)


####################################### REPRESENTATIVE: COMPLAINT DETAIL #######################################

# --------------------------/ REPRESENTATIVE: Full Complaint Detail (read-only) \-------------------------- #
class RepresentativeComplaintDetailView(RetrieveAPIView):
    serializer_class = ComplaintDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Complaint.objects.filter(representative__user_profile__user=self.request.user)
            .select_related("citizen", "category", "branch", "representative",
                "local_body_representative", "constituency").prefetch_related(
                "attachments","translations","escalations","feedback",
                "likes","responses","responses__attachments")
        )


####################################### REPRESENTATIVE: COMPLAINT RESPONSES #######################################
class RepresentativeComplaintResponseListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    parser_classes = [ MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return (ComplaintResponse.objects.filter(
                complaint__representative__user_profile__user=self.request.user,
                complaint_id=self.kwargs["complaint_id"]).select_related("representative","representative__user_profile",
                "representative__user_profile__user").prefetch_related("attachments")
            .order_by("-created_at"))

    def get_serializer_class(self):
        if self.request.method == "POST":
            return RepresentativeComplaintResponseCreateSerializer

        return ComplaintResponseSerializer

    def perform_create(self, serializer):
        complaint = get_object_or_404(
            Complaint,
            pk=self.kwargs["complaint_id"],
            representative__user_profile__user=self.request.user,
        )

        representative = get_object_or_404(
            Representative,
            user_profile__user=self.request.user,
        )

        serializer.save(
            complaint=complaint,
            representative=representative,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)

        response_serializer = ComplaintResponseSerializer(serializer.instance,context=self.get_serializer_context())

        return Response(response_serializer.data,status=status.HTTP_201_CREATED)


# --------------------------/ USER: Manual District-based Authority Lookup \-------------------------- #
class AuthoritiesByDistrictView(APIView):
    """
    Fallback for when geometry-based NearbyInfoView doesn't return
    anything (missing/rough boundary polygons, GPS drift, no location
    permission, etc). Citizen picks a district explicitly.

    GET /authorities/by-district/?district=<id>&search=<text>&lat=&lng=

    lat/lng are OPTIONAL — if the browser location was already captured
    earlier in the flow, pass it through so branches can still be sorted
    by real distance using their stored location_point. Otherwise branches
    are just listed for the district.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district_id = request.query_params.get("district")
        if not district_id:
            return Response(
                {"error": "district query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        search = request.query_params.get("search", "").strip()

        representatives = (
            Representative.objects.filter(
                constituency__district_id=district_id, is_current=True
            ).select_related("user_profile__user", "constituency", "constituency__district")
        )

        branches = (
            Branch.objects.filter(district_id=district_id, is_active=True)
            .select_related("district", "deptid")
        )

        if search:
            representatives = representatives.filter(
                Q(user_profile__user__first_name__icontains=search)
                | Q(constituency__name__icontains=search)
            )
            branches = branches.filter(
                Q(branch_name__icontains=search)
                | Q(placename__icontains=search)
                | Q(deptid__deptname__icontains=search)
            )

        # Reuse location_point for real distance if we already have the
        # citizen's coordinates from an earlier geolocation call — no need
        # to ask them to type lat/lng.
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        if lat and lng:
            try:
                user_point = Point(float(lng), float(lat), srid=4326)
                branches = branches.annotate(
                    distance=Distance("location_point", user_point)
                ).order_by("distance")
            except ValueError:
                branches = branches.order_by("branch_name")
        else:
            branches = branches.order_by("branch_name")

        return Response(
            {
                "representatives": NearbyRepresentativeSerializer(representatives, many=True).data,
                "branches": NearbyBranchSerializer(branches, many=True).data,
            },status=status.HTTP_200_OK)



class BranchEmployeeComplaintDetailView(RetrieveAPIView):
    serializer_class = (ComplaintDetailSerializer)
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (Complaint.objects.filter(assigned_employee__user_details=self.request.user)
            .select_related("citizen","category","branch",
                "representative","local_body_representative",
                "constituency","assigned_employee","assigned_employee__user_details",
            ).prefetch_related("attachments","translations","escalations","feedback","likes"))



class BranchEmployeeComplaintResponseListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser,FormParser,JSONParser,]

    # LOGGED-IN EMPLOYEE
    def get_employee(self):
        try:
            return (BranchEmployees.objects.select_related("branch_details","user_details",
                ).get(user_details=self.request.user))

        except BranchEmployees.DoesNotExist:
            raise PermissionDenied("Branch employee account ""not found.")


    # RESPONSE HISTORY
    def get_queryset(self):
        employee = self.get_employee()
        return (ComplaintResponse.objects.filter(complaint_id=self.kwargs["complaint_id"],
                complaint__assigned_employee=employee).select_related("complaint",
                "representative","representative__user_profile",
                "representative__user_profile__user","branch_employee",
                "branch_employee__user_details").prefetch_related("attachments")
            .order_by("-created_at"))


    # SERIALIZER
    def get_serializer_class(self):
        if self.request.method == "POST":
            return (BranchEmployeeComplaintResponseCreateSerializer)
        return (ComplaintResponseSerializer)


    # CREATE RESPONSE
    def perform_create(self,serializer):
        employee = self.get_employee()
        complaint = get_object_or_404(Complaint,pk=self.kwargs["complaint_id"],assigned_employee=employee,)
        serializer.save(complaint=complaint,branch_employee=employee,representative=None)

    # RETURN COMPLETE RESPONSE
    def create(self,request,*args,**kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_serializer = (ComplaintResponseSerializer(serializer.instance,context=self.get_serializer_context()))
        return Response(response_serializer.data,status=status.HTTP_201_CREATED)