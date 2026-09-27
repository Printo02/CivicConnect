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
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
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
from django.db.models import OuterRef, Subquery
import secrets
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password, check_password



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







#######################################  FORGOT PASSWORD #######################################
logger = logging.getLogger(__name__)

# 1. SEND OTP
class ForgotPasswordRequestOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = (User.objects.filter(email__iexact=email,is_active=True).order_by("id").first())

        # Do not reveal whether an email exists.
        if not user:
            return Response({
                    "message":
                        "If an account exists for this email, "
                        "an OTP has been sent."
                },status=status.HTTP_200_OK)

        # Invalidate previous unused OTPs.
        PasswordResetOTP.objects.filter(user=user,used_at__isnull=True).delete()
        # Generate 6 digit OTP
        otp = f"{secrets.randbelow(1000000):06d}"

        reset_request = PasswordResetOTP.objects.create(user=user,
            otp_hash=make_password(otp),expires_at=timezone.now() + timedelta(minutes=5))

        subject = "CivicConnect Password Reset OTP"

        message = (
            f"Hello {user.first_name or 'User'},\n\n"
            f"Your CivicConnect password reset OTP is:\n\n"
            f"{otp}\n\n"
            f"This OTP will expire in 5 minutes.\n\n"
            f"If you did not request a password reset, "
            f"you can ignore this email.\n\n"
            f"CivicConnect"
        )

        try:
            send_mail(subject=subject,message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],fail_silently=False,
            )

        except Exception:
            # OTP is useless if email delivery failed.
            reset_request.delete()

            logger.exception("Failed to send password reset OTP to user %s",user.id)

            return Response({
                    "detail":
                        "Unable to send OTP right now. "
                        "Please try again."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response({
                "message":
                    "If an account exists for this email, "
                    "an OTP has been sent."
            },
            status=status.HTTP_200_OK
        )



# 2. VERIFY OTP
class ForgotPasswordVerifyOTPView(APIView):
    permission_classes = [AllowAny]
    MAX_ATTEMPTS = 5

    def post(self, request):

        serializer = VerifyPasswordResetOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]
        user = (User.objects.filter(email__iexact=email,is_active=True).order_by("id").first())

        if not user:
            return Response({
                    "detail": "Invalid or expired OTP."
                },status=status.HTTP_400_BAD_REQUEST)

        reset_request = (PasswordResetOTP.objects.filter(user=user,
                used_at__isnull=True,verified_at__isnull=True).order_by("-created_at").first())

        if not reset_request:
            return Response({
                    "detail": "Invalid or expired OTP."
                },status=status.HTTP_400_BAD_REQUEST)

        # OTP expired
        if timezone.now() > reset_request.expires_at:
            return Response({
                    "detail":
                        "OTP has expired. Please request a new OTP."
                },status=status.HTTP_400_BAD_REQUEST)

        # Too many incorrect attempts
        if reset_request.attempts >= self.MAX_ATTEMPTS:
            return Response({"detail":
                        "Too many incorrect attempts. "
                        "Please request a new OTP."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Wrong OTP
        if not check_password(otp,reset_request.otp_hash):
            reset_request.attempts += 1
            reset_request.save(update_fields=["attempts"])
            attempts_left = (self.MAX_ATTEMPTS - reset_request.attempts)

            return Response({
                    "detail": "Invalid OTP.",
                    "attempts_left": max(attempts_left, 0)
                },status=status.HTTP_400_BAD_REQUEST)

        # OTP is correct.
        # Generate secure temporary password-reset token.
        reset_token = secrets.token_urlsafe(32)
        reset_request.verified_at = timezone.now()
        reset_request.reset_token_hash = make_password(reset_token)
        reset_request.reset_expires_at = (timezone.now() + timedelta(minutes=10))
        reset_request.save(update_fields=["verified_at","reset_token_hash","reset_expires_at"])

        return Response({
                "message": "OTP verified successfully.",
                "reset_token": reset_token
            },status=status.HTTP_200_OK)




# 3. SET NEW PASSWORD
class ForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        serializer = ResetForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        reset_token = serializer.validated_data["reset_token"]
        new_password = serializer.validated_data["new_password"]
        user = (User.objects.filter(email__iexact=email,is_active=True).order_by("id").first())

        if not user:
            return Response({
                    "detail":
                        "Invalid or expired password reset request."
                },status=status.HTTP_400_BAD_REQUEST)

        reset_request = (PasswordResetOTP.objects.filter(
                user=user,verified_at__isnull=False,used_at__isnull=True,reset_expires_at__isnull=False)
            .order_by("-verified_at").first())

        if not reset_request:
            return Response({
                    "detail":
                        "OTP verification is required."
                },status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() > reset_request.reset_expires_at:
            return Response({
                    "detail":
                        "Password reset session has expired. "
                        "Please request a new OTP."
                },status=status.HTTP_400_BAD_REQUEST)

        if not reset_request.reset_token_hash:
            return Response({
                    "detail":
                        "Invalid password reset request."
                },status=status.HTTP_400_BAD_REQUEST)

        if not check_password(reset_token,reset_request.reset_token_hash):
            return Response({
                    "detail":
                        "Invalid password reset token."
                },status=status.HTTP_400_BAD_REQUEST)

        # Prevent setting same password again
        if user.check_password(new_password):
            return Response({
                    "new_password":
                        "New password cannot be the same "
                        "as your current password."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Change password
        user.set_password(new_password)
        user.save(update_fields=["password"])
        reset_request.used_at = timezone.now()
        reset_request.save(update_fields=["used_at"])
        PasswordResetOTP.objects.filter(user=user,used_at__isnull=True).exclude(pk=reset_request.pk).delete()

        return Response(
            {
                "message":
                    "Password reset successfully. "
                    "You can now login with your new password."
            },
            status=status.HTTP_200_OK
        )




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
        return (Complaint.objects.filter(citizen=self.request.user).select_related("branch","representative","representative__user_profile","representative__user_profile__user","myward_share").order_by("-created_at"))


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
        complaint = get_object_or_404(Complaint,pk=self.kwargs["complaint_id"],assigned_employee=employee)
        serializer.save(complaint=complaint,branch_employee=employee,representative=None)

    # RETURN COMPLETE RESPONSE
    def create(self,request,*args,**kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_serializer = (ComplaintResponseSerializer(serializer.instance,context=self.get_serializer_context()))
        return Response(response_serializer.data,status=status.HTTP_201_CREATED)




def _myward_location(point):
    ward = (LocalBodyConstituency.objects.filter(boundary__isnull=False,
            boundary__covers=point,is_active=True,)
        .select_related("local_body","local_body__district").first())

    if ward:
        return (ward,ward.local_body)

    local_body_types = [
        Constituency.ConstituencyType.GRAMA_PANCHAYAT,
        Constituency.ConstituencyType.MUNICIPALITY,
        Constituency.ConstituencyType.CORPORATION,
    ]

    local_body = (Constituency.objects.filter(boundary__isnull=False,
            boundary__covers=point,is_active=True,type__in=local_body_types)
        .select_related("district").first())

    return (None,local_body)


class UserMyWardFeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        try:
            lat = float(request.query_params["lat"])
            lng = float(request.query_params["lng"])

        except (KeyError,TypeError,ValueError):
            return Response({"detail": "Valid lat and lng are required."},
                status=status.HTTP_400_BAD_REQUEST)

        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return Response({"detail":"Invalid latitude or longitude."},status=status.HTTP_400_BAD_REQUEST)

        point = Point(lng,lat,srid=4326)
        ward, local_body = (_myward_location(point))
        location_filter = Q()

        if ward:
            location_filter |= Q(ward=ward)
            location_filter |= Q(constituency=ward.local_body)
            
        if local_body:
            location_filter |= Q(constituency=local_body)

        # Makes Representative alerts work too:
        # Assembly / Parliament constituency boundary can
        # contain the user's point.
        location_filter |= Q(constituency__boundary__covers=point)

        if not (ward or local_body or Constituency.objects.filter(boundary__covers=point,is_active=True).exists()):
            return Response({"posts": [],"complaints": []},status=status.HTTP_200_OK)

        post_filter = (Q(is_active=True,approval_status=(MyWardPost.ApprovalStatus.APPROVED))& location_filter)
        post_type = (request.query_params.get("type"))

        if post_type:
            if (post_type == MyWardPost.PostType.ALERT):
                post_filter &= Q(post_type__in=[MyWardPost.PostType.ALERT,MyWardPost.PostType.DISASTER])
            else:
                post_filter &= Q(post_type=post_type)

        posts = (MyWardPost.objects.filter(post_filter).select_related("author",
                    "ward","ward__local_body","constituency","approval_branch",
                    "submitted_by_employee","submitted_by_employee__branch_details")
                .prefetch_related("attachments","disaster_verifications","authority_reviews",
                    "authority_reviews__reviewer").distinct().order_by("-created_at"))

        share_filter = Q()

        if ward:
            share_filter |= Q(ward=ward)
            share_filter |= Q(constituency=ward.local_body)

        if local_body:
            share_filter |= Q(constituency=local_body)

        shares = (MyWardComplaintShare.objects.filter(share_filter).select_related(
                "complaint","ward","constituency").prefetch_related(
                "complaint__attachments","complaint__likes",
                "complaint__responses","complaint__responses__attachments"))

        return Response({"posts": MyWardPostSerializer(posts,many=True,context={"request":request},).data,
                "complaints": MyWardComplaintShareSerializer(
                        shares,many=True,context={"request":request},).data,},
            status=status.HTTP_200_OK)



class UserShareComplaintToMyWardView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint,pk=complaint_id,citizen=request.user)

        if not complaint.location_point:
            return Response({"detail": "Complaint must have a location before sharing."},status=status.HTTP_400_BAD_REQUEST)

        ward, constituency = _myward_location(complaint.location_point)

        share, created = MyWardComplaintShare.objects.get_or_create(complaint=complaint,
            defaults={"shared_by": request.user,"ward": ward,"constituency": constituency})

        if not created:
            return Response({"detail": "Complaint is already shared."},status=status.HTTP_400_BAD_REQUEST)

        return Response(
            MyWardComplaintShareSerializer(share,context={"request": request}).data,status=status.HTTP_201_CREATED)

    def delete(self, request, complaint_id):
        share = get_object_or_404(MyWardComplaintShare,complaint_id=complaint_id,shared_by=request.user)
        share.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class BranchMyWardPostsView(generics.ListCreateAPIView):
    serializer_class = MyWardPostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MyWardPost.objects.filter(author=self.request.user,author_type=MyWardPost.AuthorType.BRANCH)

    def perform_create(self, serializer):
        branch = get_object_or_404(Branch,user_details__user=self.request.user)
        serializer.save(author=self.request.user,author_type=MyWardPost.AuthorType.BRANCH,
            location=branch.placename or branch.location,location_point=branch.location_point)


class RepresentativeMyWardPostsView(generics.ListCreateAPIView):
    serializer_class = MyWardPostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MyWardPost.objects.filter(author=self.request.user,author_type=MyWardPost.AuthorType.REPRESENTATIVE)

    def perform_create(self, serializer):
        representative = get_object_or_404(Representative,user_profile__user=self.request.user)
        serializer.save(author=self.request.user,author_type=MyWardPost.AuthorType.REPRESENTATIVE,
            constituency=representative.constituency)


class UserDisasterReportCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser,FormParser]

    MAX_FILES = 5

    MAX_FILE_SIZE = (25 * 1024 * 1024)

    ALLOWED_IMAGE_TYPES = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    }

    ALLOWED_VIDEO_TYPES = {
        "video/mp4",
        "video/webm",
        "video/quicktime",
    }

    @transaction.atomic
    def post(self, request): 
        serializer = (UserDisasterCreateSerializer(data=request.data))
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        attachments = (request.FILES.getlist("attachments"))
        # FILE COUNT
        if len(attachments) > self.MAX_FILES:
            return Response({"detail":"A maximum of 5 files is allowed."},status=status.HTTP_400_BAD_REQUEST)

        # FILE VALIDATION
        allowed_types = (self.ALLOWED_IMAGE_TYPES | self.ALLOWED_VIDEO_TYPES)
        for file_obj in attachments:
            if (file_obj.size > self.MAX_FILE_SIZE):
                return Response({"detail": f"{file_obj.name} exceeds the 25 MB limit."},
                    status=(status.HTTP_400_BAD_REQUEST))
            content_type = (file_obj.content_type or "").lower()
            if content_type not in allowed_types:
                return Response(
                    {
                        "detail":
                        f"{file_obj.name} is not "
                        "a supported image/video."
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    )
                )

        # LOCATION
        latitude = data["latitude"]
        longitude = data["longitude"]
        point = Point(longitude,latitude,srid=4326)

        ward, constituency = _myward_location(point)

        if not ward and not constituency:
            return Response({
                    "detail": "The selected location could not be matched to a supported local body."
                },status=status.HTTP_400_BAD_REQUEST)

        # CREATE DISASTER
        disaster = MyWardPost.objects.create(author=request.user,
            author_type=(MyWardPost.AuthorType.USER),
            post_type=(MyWardPost.PostType.DISASTER),
            title=data["title"],
            description=data["description"],
            location=data.get("location", ""),
            location_point=point,
            ward=ward,
            constituency=constituency,
            is_important=data.get("is_important",True),
            is_active=True
        )

        # ATTACHMENTS
        for file_obj in attachments:
            MyWardPostAttachment.objects.create(
                post=disaster,
                file=file_obj,
                original_filename=(file_obj.name),
                mime_type=(file_obj.content_type or ""),
                file_size=(file_obj.size),
            )

        disaster = (MyWardPost.objects.select_related(
                "author","ward","ward__local_body","constituency",
            ).prefetch_related("attachments","disaster_verifications").get(pk=disaster.pk))

        return Response(MyWardDisasterSerializer(disaster,
                context={"request": request}).data,status=status.HTTP_201_CREATED)




class UserMyWardDisasterListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            lat = float(request.query_params["lat"])
            lng = float(request.query_params["lng"])
        except (KeyError,TypeError,ValueError):
            return Response({"detail":"Valid lat and lng are required."},status=status.HTTP_400_BAD_REQUEST)

        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return Response({"detail":"Invalid latitude or longitude."},status=status.HTTP_400_BAD_REQUEST)
        point = Point(lng,lat,srid=4326)
        ward, constituency = (_myward_location(point))

        if not ward:
            return Response([],status=status.HTTP_200_OK)

        disasters = (MyWardPost.objects.filter(post_type=(MyWardPost.PostType.DISASTER),ward=ward,is_active=True)
            .select_related("author","ward","ward__local_body","constituency",
            ).prefetch_related("attachments","disaster_verifications").order_by("-created_at"))

        serializer = (MyWardDisasterSerializer(disasters,many=True,context={"request": request}))
        return Response(serializer.data,status=status.HTTP_200_OK)
    

class UserMyWardDisasterDetailView(APIView):

    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        disaster = get_object_or_404(MyWardPost.objects.select_related("author",
                "ward","ward__local_body","constituency").prefetch_related("attachments","disaster_verifications"),
            pk=pk,post_type=(MyWardPost.PostType.DISASTER),is_active=True)
        serializer = (MyWardDisasterSerializer(disaster,context={"request": request}))
        return Response(serializer.data)
    


class BranchMyWardPostsView(generics.ListCreateAPIView):
    serializer_class = MyWardPostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (MyWardPost.objects.filter(author=self.request.user,author_type=(MyWardPost.AuthorType.BRANCH))
            .select_related("ward","constituency").order_by("-created_at"))
        
    def perform_create(self,serializer):
        branch = get_object_or_404(Branch,user_details__user=(self.request.user),)

        ward = None
        local_body = None

        if branch.location_point:
            ward, local_body = (_myward_location(branch.location_point))

        serializer.save(
            author=self.request.user,
            author_type=(MyWardPost.AuthorType.BRANCH),
            ward=ward,
            constituency=local_body,
            location=(branch.placename or branch.location),
            location_point=(branch.location_point),
        )




class RepresentativeMyWardPostsView(generics.ListCreateAPIView):
    serializer_class = MyWardPostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (MyWardPost.objects.filter(author=self.request.user,author_type=(MyWardPost.AuthorType.REPRESENTATIVE),
            ).select_related("constituency").order_by("-created_at"))

    def perform_create(self,serializer):
        representative = get_object_or_404(Representative,user_profile__user=(self.request.user))

        serializer.save(author=self.request.user,author_type=(MyWardPost.AuthorType.REPRESENTATIVE),
            constituency=(representative.constituency))







class UserDisasterVerificationView(APIView):
    permission_classes = [IsAuthenticated]
    @transaction.atomic
    def post(self,request,disaster_id):
        disaster = get_object_or_404(MyWardPost.objects.select_related(
                "ward","ward__local_body","constituency"),
            pk=disaster_id,post_type=(MyWardPost.PostType.DISASTER),is_active=True)

        if (disaster.author_id == request.user.id):
            return Response({"detail":"You cannot verify your own disaster report."},
                status=status.HTTP_403_FORBIDDEN
            )

        vote = request.data.get("vote")

        allowed_votes = {MyWardDisasterVerification.VoteChoices.VERIFIED,
            MyWardDisasterVerification.VoteChoices.NOT_VERIFIED}

        if vote not in allowed_votes:
            return Response({"vote":"Vote must be 'verified' or 'not_verified'."},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            latitude = float(request.data.get("latitude"))
            longitude = float(request.data.get("longitude"))

        except (TypeError,ValueError):
            return Response({
                    "detail":
                    "Your current latitude and longitude are required."
                },status=status.HTTP_400_BAD_REQUEST)

        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return Response({"detail":
                    "Invalid latitude or longitude."
                },status=status.HTTP_400_BAD_REQUEST)

        user_point = Point(longitude,latitude,srid=4326,)

        voter_ward, voter_local_body = (_myward_location(user_point))

        if (not voter_ward and not voter_local_body):
            return Response({
                    "detail":"Your current location could not be matched to a ward or local body."
                },status=status.HTTP_400_BAD_REQUEST)

        # Exact ward check where disaster has an exact ward.
        if disaster.ward_id:
            if (not voter_ward or voter_ward.id != disaster.ward_id):
                return Response({"detail":"Only citizens currently within this ward can verify this disaster."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Local-body fallback for reports where exact ward
        # polygons were unavailable during report creation.
        elif disaster.constituency_id:
            voter_local_body_id = (voter_ward.local_body_id
                if voter_ward
                else (voter_local_body.id
                    if voter_local_body
                    else None
                )
            )

            if (voter_local_body_id != disaster.constituency_id):
                return Response({"detail":
                        "Only citizens within this local body can verify this disaster."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        verification, created = (MyWardDisasterVerification.objects.update_or_create(
                disaster=disaster,user=request.user,defaults={"vote": vote,"ward": voter_ward},))

        verifications = (MyWardDisasterVerification.objects.filter(disaster=disaster))

        return Response({"message":("Verification recorded."
                        if created
                        else
                        "Verification updated."
                    ),

                "verification":DisasterVerificationSerializer(verification).data,
                "verified_count":verifications.filter(vote=(MyWardDisasterVerification.VoteChoices.VERIFIED)).count(),
                "not_verified_count":verifications.filter(vote=(MyWardDisasterVerification.VoteChoices.NOT_VERIFIED)
                    ).count(),
                "my_verification":verification.vote},status=status.HTTP_200_OK)


class UserDisasterVerificationDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self,request,disaster_id):
        verification = get_object_or_404(MyWardDisasterVerification,disaster_id=disaster_id,user=request.user)
        verification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



def _authority_can_review_disaster(user,disaster):
    branch = (Branch.objects.filter(user_details__user=user,is_active=True).first())
    if branch:
        if not branch.location_point:
            return (False,None)

        branch_ward, branch_local_body = (_myward_location(branch.location_point))

        branch_local_body_id = (branch_ward.local_body_id 
            if branch_ward
            else ( branch_local_body.id
                if branch_local_body
                else None))

        disaster_local_body_id = (disaster.ward.local_body_id 
            if disaster.ward_id
            else disaster.constituency_id
        )

        if (branch_local_body_id and disaster_local_body_id and branch_local_body_id == disaster_local_body_id):
            return (True,MyWardDisasterAuthorityReview.ReviewerType.BRANCH)

        return (False,None)

    representative = (Representative.objects.filter(user_profile__user=user,is_current=True,)
        .select_related("constituency").first())

    if (representative and representative.constituency and representative.constituency.boundary
        and disaster.location_point and representative.constituency.boundary.covers(disaster.location_point)):
        return (True,MyWardDisasterAuthorityReview.ReviewerType.REPRESENTATIVE)

    return (False,None)




class DisasterAuthorityReviewView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self,request,disaster_id):
        disaster = get_object_or_404(MyWardPost.objects.select_related(
                "ward","ward__local_body","constituency",),
            pk=disaster_id,post_type=(MyWardPost.PostType.DISASTER),is_active=True)

        allowed, reviewer_type = (_authority_can_review_disaster(request.user,disaster,))

        if not allowed:
            return Response({"detail":
                    "You are not an authorized branch or representative for this disaster area."},
                status=status.HTTP_403_FORBIDDEN)

        input_serializer = (DisasterAuthorityReviewCreateSerializer(data=request.data))
        input_serializer.is_valid(raise_exception=True)

        review = MyWardDisasterAuthorityReview.objects.create(disaster=disaster,
            reviewer=request.user,reviewer_type=reviewer_type,comment=input_serializer.validated_data.get("comment",""),
            is_verified=(input_serializer.validated_data["is_verified"]
                if "is_verified" in input_serializer.validated_data
                else None
            ),
        )

        disaster = (MyWardPost.objects.select_related("author","ward","ward__local_body","constituency")
            .prefetch_related("attachments","disaster_verifications","authority_reviews",
                "authority_reviews__reviewer").get(pk=disaster.pk))

        return Response({
                "message": ("Authority review added."
                        if created
                        else
                        "Authority review updated."),
                "review": MyWardDisasterAuthorityReviewSerializer(review).data,
                "disaster": MyWardPostSerializer(disaster,
                        context={"request":request}).data,
            },status=status.HTTP_200_OK)
        
        


class UserMyWardDisasterListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        try:
            lat = float(request.query_params["lat"])
            lng = float(request.query_params["lng"])

        except (KeyError,TypeError,ValueError):
            return Response(
                {"detail": "Valid lat and lng are required."},status=status.HTTP_400_BAD_REQUEST)

        point = Point(lng,lat,srid=4326)
        ward, local_body = (_myward_location(point))
        location_filter = Q()

        if ward:
            location_filter |= Q(ward=ward)
            location_filter |= Q(constituency=ward.local_body)

        if local_body:
            location_filter |= Q(constituency=local_body)

        if (not ward and not local_body):
            return Response([],status=status.HTTP_200_OK)

        disasters = (MyWardPost.objects.filter(location_filter,
                post_type=(MyWardPost.PostType.DISASTER),is_active=True)
            .select_related("author","ward","ward__local_body","constituency")
            .prefetch_related("attachments","disaster_verifications","authority_reviews",
                "authority_reviews__reviewer").distinct().order_by("-created_at"))

        return Response(MyWardPostSerializer(disasters,many=True,
                context={"request":request}).data,status=status.HTTP_200_OK)




# ============================================================
# REPRESENTATIVE MYWARD - DISASTER REPORTS
# ============================================================

class RepresentativeMyWardDisasterListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # REPRESENTATIVE
        representative = (Representative.objects.select_related("user_profile","user_profile__user","constituency")
            .filter(user_profile__user=request.user,is_current=True).first())

        if not representative:
            return Response({
                    "detail":
                    "Representative profile not found."
                },status=status.HTTP_404_NOT_FOUND)
        constituency = (representative.constituency)

        if not constituency:
            return Response({
                    "detail":
                    "No constituency is assigned to this representative.",
                    "disasters": [],
                },status=status.HTTP_400_BAD_REQUEST)
        # BASE DISASTER QUERY
        disaster_filter = Q(post_type=(MyWardPost.PostType.DISASTER),is_active=True)
        # CONSTITUENCY FILTER
        constituency_filter = Q(constituency=constituency)
        if constituency.boundary:
            constituency_filter |= Q(location_point__isnull=False,location_point__coveredby=(constituency.boundary))
        disaster_filter &= (constituency_filter)

        # OPTIONAL STATUS FILTER
        review_status = (request.query_params.get("status", "").strip().lower())
        disasters = (MyWardPost.objects.filter(disaster_filter).select_related(
                "author","ward","ward__local_body","constituency").prefetch_related(
                "attachments","disaster_verifications","authority_reviews","authority_reviews__reviewer").distinct())
        
        latest_rep_decision = (MyWardDisasterAuthorityReview.objects.filter(disaster=OuterRef("pk"),reviewer=request.user,is_verified__isnull=False).order_by("-created_at", "-id").values("is_verified")[:1])
        
        disasters = disasters.annotate(my_latest_verification=Subquery(latest_rep_decision))
        if review_status == "verified":
            disasters = disasters.filter(my_latest_verification=True)
        elif review_status == "needs_review":
            disasters = disasters.filter(my_latest_verification__isnull=True)
        
        # FILTER:
        if review_status == "verified":
            disasters = (disasters.filter(authority_reviews__is_verified=True).distinct())
        elif review_status == "needs_review":
            disasters = (disasters.exclude(authority_reviews__reviewer=request.user))
        # SORT
        sort = (request.query_params.get("sort", "latest").strip().lower())
        if sort == "oldest":
            disasters = (disasters.order_by("created_at"))
        else:
            disasters = (disasters.order_by("-created_at"))
        # RESPONSE
        serializer = (MyWardPostSerializer(disasters,many=True,context={"request": request}))
        return Response({"representative": {
                    "id":representative.id,
                    "name": (request.user.get_full_name() or request.user.first_name or request.user.username),
                    "constituency_id":constituency.id,
                    "constituency_name":constituency.name,
                    "constituency_type":constituency.type,
                },
                "count":disasters.count(),
                "disasters":serializer.data,
            },
            status=status.HTTP_200_OK
        )
        


class RepresentativeMyWardDisasterDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_representative(self,request):
        return get_object_or_404(Representative.objects.select_related("constituency","user_profile__user"),
            user_profile__user=request.user,is_current=True)

    def get(self, request, disaster_id):
        representative = (self.get_representative(request))
        constituency = (representative.constituency)

        if not constituency:
            return Response({
                    "detail": "No constituency is assigned to this representative."},
                status=status.HTTP_403_FORBIDDEN)

        filters = Q(pk=disaster_id,post_type=(MyWardPost.PostType.DISASTER),is_active=True)
        location_filter = Q(constituency=constituency)

        if constituency.boundary:
            location_filter |= Q(location_point__isnull=False,location_point__coveredby=(constituency.boundary))

        disaster = (MyWardPost.objects.filter(filters & location_filter)
            .select_related("author","ward","ward__local_body","constituency")
            .prefetch_related("attachments","disaster_verifications","authority_reviews","authority_reviews__reviewer")
            .first())

        if not disaster:
            return Response({"detail":
                    "Disaster report not found in your constituency."},
                status=status.HTTP_404_NOT_FOUND)

        return Response(MyWardPostSerializer(disaster,context={"request": request}).data,status=status.HTTP_200_OK)
    
    




class RepresentativeDisasterAuthorityReviewView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, disaster_id):
        representative = get_object_or_404(Representative.objects.select_related(
                "constituency","user_profile__user"),
            user_profile__user=request.user,is_current=True)

        constituency = representative.constituency

        if not constituency:
            return Response({
                    "detail":"No constituency is assigned to this representative."},
                status=status.HTTP_403_FORBIDDEN)

        disaster = get_object_or_404(MyWardPost,pk=disaster_id,post_type=MyWardPost.PostType.DISASTER,is_active=True)
        allowed = disaster.constituency_id == constituency.id

        if (not allowed and constituency.boundary and disaster.location_point):
            allowed = constituency.boundary.covers(disaster.location_point)

        if not allowed:
            return Response({"detail":"You cannot review disasters outside your constituency."},
                status=status.HTTP_403_FORBIDDEN)

        serializer = DisasterAuthorityReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        review = MyWardDisasterAuthorityReview.objects.create(disaster=disaster,
            reviewer=request.user,reviewer_type=(MyWardDisasterAuthorityReview.ReviewerType.REPRESENTATIVE),
            comment=data.get("comment", ""),
            is_verified=(data["is_verified"]
                if "is_verified" in data
                else None))

        disaster = (MyWardPost.objects.prefetch_related("authority_reviews","authority_reviews__reviewer")
            .get(pk=disaster.pk))

        return Response({
                "message": "Authority response added.",
                "review": (MyWardDisasterAuthorityReviewSerializer(review).data),
                "officially_verified": (get_disaster_official_verification(disaster)),
            },status=status.HTTP_201_CREATED)




# BRANCH MYWARD - DISASTER REPORTS
# 

class BranchMyWardDisasterListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch = (Branch.objects.select_related("user_details__user","deptid").filter(user_details__user=request.user,is_active=True).first())

        if not branch:
            return Response({"detail": "Branch profile not found."},status=status.HTTP_404_NOT_FOUND)

        if not branch.location_point:
            return Response({"detail":"Branch location is not configured.",
                    "disasters": []},status=status.HTTP_400_BAD_REQUEST)

        # DETERMINE BRANCH LOCAL BODY
        branch_ward, branch_local_body = (_myward_location(branch.location_point))
        branch_local_body_id = (branch_ward.local_body_id
            if branch_ward
            else (branch_local_body.id
                if branch_local_body
                else None
            )
        )

        if not branch_local_body_id:
            return Response({"detail":"Branch location could not be matched to a local body.",
                    "disasters": []},status=status.HTTP_400_BAD_REQUEST)

        # BASE QUERY
        disaster_filter = Q(post_type=MyWardPost.PostType.DISASTER,is_active=True)
        location_filter = (Q(ward__local_body_id=branch_local_body_id) |
            Q(constituency_id=branch_local_body_id))

        disasters = (MyWardPost.objects.filter(disaster_filter & location_filter)
            .select_related("author","ward","ward__local_body","constituency")
            .prefetch_related("attachments","disaster_verifications","authority_reviews",
                "authority_reviews__reviewer").distinct())

        # BRANCH'S LATEST DECISION
        latest_branch_decision = (MyWardDisasterAuthorityReview.objects.filter(disaster=OuterRef("pk"),
                reviewer=request.user,is_verified__isnull=False).order_by("-created_at","-id",)
            .values("is_verified")[:1])
        disasters = disasters.annotate(my_latest_verification=Subquery(latest_branch_decision))

        # REVIEW FILTER
        review_status = (request.query_params.get("status", "").strip().lower())

        if review_status == "verified":
            disasters = disasters.filter(my_latest_verification=True)
        elif review_status == "not_verified":
            disasters = disasters.filter(my_latest_verification=False)
        elif review_status == "needs_review":
            disasters = disasters.filter(my_latest_verification__isnull=True)

        # SORT
        sort = (request.query_params.get("sort", "latest").strip().lower())

        if sort == "oldest":
            disasters = disasters.order_by("created_at")
        else:
            disasters = disasters.order_by("-created_at")

        serializer = MyWardPostSerializer(disasters,many=True,context={"request": request})
        return Response({
                "branch": {
                    "id": branch.id,
                    "branch_name":branch.branch_name,
                    "department":(branch.deptid.deptname
                            if branch.deptid
                            else None),
                    "placename":branch.placename,
                },
                "count":disasters.count(),
                "disasters":serializer.data,
            },status=status.HTTP_200_OK)



class BranchMyWardDisasterDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_branch(self, request):
        return get_object_or_404(Branch.objects.select_related("user_details__user","deptid",),user_details__user=request.user,is_active=True)

    def get(self, request, disaster_id):
        branch = self.get_branch(request)

        if not branch.location_point:
            return Response({"detail":"Branch location is not configured."},status=status.HTTP_403_FORBIDDEN)

        branch_ward, branch_local_body = (_myward_location(branch.location_point))

        branch_local_body_id = (branch_ward.local_body_id
            if branch_ward
            else (branch_local_body.id
                if branch_local_body
                else None
            ))

        if not branch_local_body_id:
            return Response({"detail":"Branch local body could not be determined."},status=status.HTTP_403_FORBIDDEN)

        disaster = (MyWardPost.objects.filter(Q(pk=disaster_id,post_type=MyWardPost.PostType.DISASTER,is_active=True)
                &(Q(ward__local_body_id=branch_local_body_id) | Q(constituency_id=branch_local_body_id))
            ).select_related("author","ward","ward__local_body","constituency").prefetch_related(
                "attachments","disaster_verifications","authority_reviews","authority_reviews__reviewer").first())


        if not disaster:
            return Response({"detail":"Disaster report not found in your branch area."},status=status.HTTP_404_NOT_FOUND)

        serializer = MyWardPostSerializer(disaster,context={"request": request})
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    

class BranchDisasterAuthorityReviewView(APIView):
    permission_classes = [IsAuthenticated]
    @transaction.atomic
    def post(self,request,disaster_id):

        branch = get_object_or_404(Branch.objects.select_related("user_details__user"),
            user_details__user=request.user,is_active=True)
        disaster = get_object_or_404(MyWardPost.objects.select_related("ward","ward__local_body","constituency"),
            pk=disaster_id,post_type=MyWardPost.PostType.DISASTER,is_active=True)


        # Reuse existing backend authority logic.
        allowed, reviewer_type = (_authority_can_review_disaster(request.user,disaster))


        if (not allowed or reviewer_type != MyWardDisasterAuthorityReview.ReviewerType.BRANCH):
            return Response({"detail":"You cannot review disasters outside your branch area."},
                status=status.HTTP_403_FORBIDDEN)

        serializer = (DisasterAuthorityReviewCreateSerializer(data=request.data))
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        review = (MyWardDisasterAuthorityReview.objects.create(disaster=disaster,reviewer=request.user,
                reviewer_type=(MyWardDisasterAuthorityReview.ReviewerType.BRANCH),
                comment=data.get("comment",""),
                is_verified=(data["is_verified"]
                    if "is_verified" in data
                    else None)))

        disaster = (MyWardPost.objects.prefetch_related("authority_reviews","authority_reviews__reviewer")
            .get(pk=disaster.pk))


        return Response({
                "message":"Authority response added.",
                "review":MyWardDisasterAuthorityReviewSerializer(review).data,
                "officially_verified":get_disaster_official_verification(disaster),
            },status=status.HTTP_201_CREATED)



# ============================================================
# BRANCH EMPLOYEE - MYWARD POSTS
# ============================================================

class BranchEmployeeMyWardPostsView(generics.ListCreateAPIView):
    serializer_class = (BranchEmployeeMyWardPostSerializer)
    permission_classes = [IsAuthenticated]

    def get_employee(self):
        employee = (BranchEmployees.objects
            .select_related("user_details","branch_details","branch_details__deptid")
            .filter(user_details=self.request.user,is_active=True,user_details__is_active=True).first())

        if not employee:
            raise PermissionDenied("Active branch employee account required.")
        return employee

    def get_queryset(self):
        employee = self.get_employee()

        queryset = (MyWardPost.objects.filter(submitted_by_employee=employee,author_type=(
                    MyWardPost.AuthorType.BRANCH_EMPLOYEE))
            .select_related("submitted_by_employee","submitted_by_employee__user_details",
                "approval_branch","reviewed_by").order_by("-created_at"))
        approval_status = (self.request.query_params.get("status"))

        if approval_status:
            allowed = {MyWardPost.ApprovalStatus.PENDING,MyWardPost.ApprovalStatus.APPROVED,MyWardPost.ApprovalStatus.REJECTED}


            if approval_status in allowed:
                queryset = queryset.filter(approval_status=approval_status)

        return queryset


    @transaction.atomic
    def perform_create(self, serializer):
        employee = self.get_employee()
        branch = employee.branch_details

        if not branch.is_active:
            raise PermissionDenied("Your branch is currently inactive.")

        ward = None
        local_body = None

        if branch.location_point:
            ward, local_body = (_myward_location(branch.location_point))

        serializer.save(
            author=self.request.user,
            author_type=(MyWardPost.AuthorType.BRANCH_EMPLOYEE),
            submitted_by_employee=employee,
            approval_branch=branch,
            approval_status=(
                MyWardPost
                .ApprovalStatus
                .PENDING
            ),
            # Pending post must never appear publicly
            is_active=False,
            ward=ward,
            constituency=local_body,
            location=(branch.placename or branch.location),
            location_point=(branch.location_point),
            reviewed_by=None,
            reviewed_at=None,
            rejection_reason="",
        )


# ============================================================
# BRANCH - MYWARD POST APPROVAL LIST
# ============================================================

class BranchMyWardApprovalListView(generics.ListAPIView):
    serializer_class = (BranchEmployeeMyWardPostSerializer)
    permission_classes = [IsAuthenticated]

    def get_branch(self):
        branch = (Branch.objects.select_related("user_details__user")
            .filter(user_details__user=self.request.user,is_active=True).first())

        if not branch:
            raise PermissionDenied("Active branch account required.")
        return branch


    def get_queryset(self):
        branch = self.get_branch()
        queryset = (MyWardPost.objects.filter(approval_branch=branch,author_type=(
                    MyWardPost.AuthorType.BRANCH_EMPLOYEE))
            .select_related("submitted_by_employee","submitted_by_employee__user_details","approval_branch",
                "reviewed_by").order_by("-created_at"))
        approval_status = (self.request.query_params.get("status"))

        if approval_status:
            allowed = {MyWardPost.ApprovalStatus.PENDING,
                MyWardPost.ApprovalStatus.APPROVED,MyWardPost.ApprovalStatus.REJECTED}

            if approval_status in allowed:
                queryset = queryset.filter(approval_status=approval_status)

        return queryset



# BRANCH - APPROVE / REJECT EMPLOYEE MYWARD POST


class BranchMyWardApprovalReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get_branch(self, request):
        branch = (Branch.objects.select_related("user_details","user_details__user")
            .filter(user_details__user=request.user,is_active=True).first())

        if not branch:
            raise PermissionDenied("Active branch account required.")
        return branch


    @transaction.atomic
    def patch(self, request, pk):
        branch = self.get_branch(request)
        # FIND POST
        post = (MyWardPost.objects.select_for_update().filter(
                pk=pk,approval_branch=branch,author_type=(MyWardPost.AuthorType.BRANCH_EMPLOYEE))
            .first())


        if not post:
            return Response({
                    "detail":
                    "Post not found or does not belong to this branch."
                },status=status.HTTP_404_NOT_FOUND)


        # ONLY PENDING POSTS CAN BE REVIEWED
        if (post.approval_status != MyWardPost.ApprovalStatus.PENDING):
            return Response({
                    "detail":
                    f"This post is already {post.approval_status}."
                },status=status.HTTP_400_BAD_REQUEST)



        # DECISION
        raw_decision = request.data.get("decision")

        if not isinstance(raw_decision, str):
            return Response({
                    "decision":
                    "Decision is required."
                },status=status.HTTP_400_BAD_REQUEST)

        decision = (raw_decision.strip().lower())
        allowed_decisions = {
            MyWardPost.ApprovalStatus.APPROVED,
            MyWardPost.ApprovalStatus.REJECTED,
        }


        if decision not in allowed_decisions:
            return Response({
                    "decision":
                    "Decision must be 'approved' or 'rejected'."
                },status=status.HTTP_400_BAD_REQUEST)



        # REJECTION REASON
        raw_reason = request.data.get("rejection_reason","")

        rejection_reason = (str(raw_reason).strip()
            if raw_reason is not None
            else ""
        )


        if (decision == MyWardPost.ApprovalStatus.REJECTED and not rejection_reason):
            return Response({
                    "rejection_reason":
                    "Please provide a reason for rejection."
                },status=status.HTTP_400_BAD_REQUEST)


        # APPROVE
        if (decision == MyWardPost.ApprovalStatus.APPROVED):
            post.approval_status = (MyWardPost.ApprovalStatus.APPROVED)
            post.is_active = True
            post.rejection_reason = ""
        # REJECT
        else:
            post.approval_status = (MyWardPost.ApprovalStatus.REJECTED)
            post.is_active = False
            post.rejection_reason = (rejection_reason)
        # REVIEW INFO
        post.reviewed_by = request.user
        post.reviewed_at = timezone.now()
        post.save()

        # SAFE RESPONSE
        employee_name = None
        if post.submitted_by_employee:
            employee_user = (post.submitted_by_employee.user_details)
            employee_name = (employee_user.get_full_name() 
                or employee_user.first_name
                or employee_user.username)


        return Response(
            {
                "id": post.id,
                "title": post.title,
                "post_type": post.post_type,
                "approval_status": post.approval_status,
                "is_active":post.is_active,
                "employee_name":employee_name,
                "branch_name":branch.branch_name,
                "rejection_reason":post.rejection_reason,
                "reviewed_by": request.user.first_name or request.user.username,
                "reviewed_at": post.reviewed_at,
                "message": ("Post approved and published successfully."
                    if post.approval_status == MyWardPost.ApprovalStatus.APPROVED
                    else
                    "Post rejected successfully."
                )
            },status=status.HTTP_200_OK)
