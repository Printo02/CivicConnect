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
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .utils import generate_dept_email
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView, RetrieveUpdateDestroyAPIView,DestroyAPIView
from rest_framework.exceptions import NotFound
from django.contrib.auth import update_session_auth_hash
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
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
            return Response({"message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']

        try:
            role = user.profile.role or 'user'
        except UserDetail.DoesNotExist:
            role = 'user'

        refresh = RefreshToken.for_user(user)

        return Response({"message": "Login Successfully","access": str(refresh.access_token),
            "refresh": str(refresh),"role": role,"name": user.first_name,}, status=status.HTTP_200_OK)

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
        obj = User.objects.all().order_by('-date_joined')
        user = obj.filter(is_staff=False)
        serializer = AdminUserViewSerializers(user,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)


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
            return Response(
                {"message": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        if "is_active" in request.data:
            user.is_active = request.data["is_active"]
        user.save()
        serializer = AdminUserViewSerializers(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# --------------------------/ ADMIN: List Constituency \-------------------------- #
class ConstituencyListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        constituencies = (Constituency.objects.select_related("district").prefetch_related(
                "constituency__user_profile__user").all().order_by("name"))
        serializer = ConstituencySerializer(constituencies,many=True)
        return Response(serializer.data)

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


# --------------------------/ ADMIN: Assign Representative to Constituency \-------------------------- #
class AssignRepresentativeView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        constituency = Constituency.objects.select_related("district").filter(pk=pk).first()
        if not constituency:
            return Response({"error": "Constituency not found."}, status=status.HTTP_404_NOT_FOUND)
        user_id = request.data.get("representative")
        if not user_id:
            return Response({"error": "Representative user is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            user_profile = UserDetail.objects.get(user=user)
        except UserDetail.DoesNotExist:
            return Response({"error": "User profile not found."}, status=status.HTTP_404_NOT_FOUND)

        existing_rep = Representative.objects.filter(user_profile=user_profile).first()

        if existing_rep:
            if (existing_rep.constituency_id and existing_rep.constituency_id != constituency.id
                    and existing_rep.is_current):
                return Response(
                    {"error": f"This user is already the representative for {existing_rep.constituency.name}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # FIX: demote whoever currently represents this constituency, unless it's the same person
        current_rep = Representative.objects.filter(constituency=constituency, is_current=True).first()
        if current_rep and (not existing_rep or current_rep.id != existing_rep.id):
            current_rep.constituency = None
            current_rep.is_current = False
            current_rep.save(update_fields=["constituency", "is_current"])

            old_profile = current_rep.user_profile
            old_profile.role = "user"
            old_profile.save(update_fields=["role"])

        if existing_rep:
            existing_rep.constituency = constituency
            existing_rep.is_current = True
            if not existing_rep.start_date:
                existing_rep.start_date = timezone.now().date()
            existing_rep.save()
            representative = existing_rep
        else:
            representative = Representative.objects.create(user_profile=user_profile, constituency=constituency,
                start_date=timezone.now().date(), is_current=True,)

        user_profile.role = "representative"
        user_profile.save(update_fields=["role"])

        return Response(ConstituencySerializer(constituency).data, status=status.HTTP_200_OK)


# --------------------------/ ADMIN: List Representative \-------------------------- #
class RepresentativeListCreateView(generics.ListCreateAPIView):
    queryset = Representative.objects.select_related("user_profile", "constituency").all().order_by("-updated_at")
    permission_classes = [IsAuthenticated]
    serializer_class = RepresentativeSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        representative = serializer.save()

        # Change the user's role to representative
        user_profile = representative.user_profile
        user_profile.role = "representative"
        user_profile.save(update_fields=["role"])
        # Return complete representative data
        output = RepresentativeSerializer(representative,context={"request": request})
        return Response(output.data,status=status.HTTP_201_CREATED)


# --------------------------/ ADMIN: View Representative Detail \-------------------------- #
class RepresentativeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Representative.objects.select_related("user_profile__user", "constituency", "constituency__district")
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return RepresentativeAdminUpdateSerializer
        return RepresentativeSerializer

    def perform_destroy(self, instance):
        user_profile = instance.user_profile
        user = user_profile.user
        constituency = instance.constituency

        if constituency:
            pass

        user_profile.role = "user"
        user_profile.save(update_fields=["role"])
        instance.delete()


# --------------------------/  ADMIN: View Representative Detail  \-------------------------- #
class RepresentativeStatusView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, pk):
        representative = Representative.objects.filter(id=pk).select_related("user_profile__user", "constituency").first()
        if not representative:
            return Response({"error": "Representative not found."}, status=status.HTTP_404_NOT_FOUND)


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
    # permission_classes = [IsAuthenticated]
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




####################################### DEPT-EMPLOYEE MODULE (sub-module of DEPT) #######################################
