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
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.exceptions import NotFound

####################################### Permission #######################################





####################################### Registration #######################################
class RegisterAPI(APIView):
    permission_classes = [AllowAny]
    def post(self,request):
        data = request.data
        serializer = RegistrationSerializers(data=data)
        if not serializer.is_valid():
            return Response({"message": serializer.errors}, status=status.HTTP_404_NOT_FOUND)

        serializer.save()
        return Response({"message": "Registered Successfully.. Please Login"}, status=status.HTTP_201_CREATED)

####################################### Login #######################################
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

        return Response({
            "message": "Login Successfully",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": role,
            "name": user.first_name,
        }, status=status.HTTP_200_OK)

####################################### District #######################################
class DistrictAPI(APIView):
    def get(self,request):
        objts = District.objects.all()
        serializer = DistrictSerializer(objts,many=True)
        return Response(serializer.data)
    
    


####################################### ADMIN MODULE  #######################################
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
            return Response(
                {'current_password': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)



class AdminUserViewAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        obj = User.objects.all().order_by('-date_joined')
        user = obj.filter(is_staff=False)

        serializer = AdminUserViewSerializers(
            user,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )



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


class DepartmentAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        departments = Dept.objects.all().order_by("deptname")
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,
                            status=status.HTTP_201_CREATED)

        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)
    


class DepartmentDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get_object(self, pk):
        try:
            return Dept.objects.get(pk=pk)
        except Dept.DoesNotExist:
            return None


    def delete(self, request, pk):
        dept = self.get_object(pk)

        if dept is None:
            return Response(
                {"message": "Department not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        dept.delete()

        return Response(
            {"message": "Department deleted successfully"},
            status=status.HTTP_200_OK
        )



class DepartmentBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        branches = DeptDetails.objects.filter(dept_id=pk)
        serializer = DeptDetailsSerializer(branches, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        try:
            dept = Dept.objects.get(pk=pk)
        except Dept.DoesNotExist:
            return Response(
                {"message": "Department not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = DeptDetailsSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(dept=dept)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)
    

class VerifyBranchAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, pk):
        try:
            branch = DeptDetails.objects.get(pk=pk)
        except DeptDetails.DoesNotExist:
            return Response(
                {"message":"Branch not found"},
                status=404
            )

        branch.is_verified = True
        branch.save()

        serializer = DeptDetailsSerializer(branch)

        return Response(serializer.data)
    
    



class DeptCreateView(generics.CreateAPIView):
    """
    Central admin only: creates a dept, auto-generates email + password.
    """
    queryset = Dept.objects.all()
    serializer_class = DeptCreateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dept = serializer.save()
        return Response(
            {
                "id": dept.id,
                "deptname": dept.deptname,
                "email": dept.email,
                "message": "Department created. Initial password = email (dept should change it after first login).",
            },
            status=status.HTTP_201_CREATED,
        )


class DeptListView(generics.ListAPIView):
    queryset = Dept.objects.all()
    serializer_class = DeptSerializer
    permission_classes = [IsAuthenticated] 
    


class DeptGenerateCredentialsView(APIView):
    """
    POST /depts/<id>/generate/
    Called when admin clicks "Generate" — creates email + sets password = email.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        dept = get_object_or_404(Dept, pk=pk)

        if dept.email:
            return Response(
                {"detail": "Credentials already generated for this department."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = generate_dept_email(dept.deptname)
        dept.email = email
        dept.set_password(email)
        dept.save()

        return Response(DeptSerializer(dept).data, status=status.HTTP_200_OK)
    
    

class ConstituencyListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        constituencies = Constituency.objects.select_related('district', 'representative').all().order_by('name')
        return Response(ConstituencySerializer(constituencies, many=True).data)

    def post(self, request):
        serializer = ConstituencySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConstituencyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return Constituency.objects.filter(id=pk).first()

    def patch(self, request, pk):
        constituency = self.get_object(pk)
        if not constituency:
            return Response({'error': 'Constituency not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ConstituencySerializer(constituency, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        constituency = self.get_object(pk)
        if not constituency:
            return Response({'error': 'Constituency not found.'}, status=status.HTTP_404_NOT_FOUND)
        constituency.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConstituencyTypesView(APIView):
    """Returns the ConstituencyType choices so the frontend dropdown stays in sync with the model automatically."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        choices = [{'value': val, 'label': label} for val, label in Constituency.ConstituencyType.choices]
        return Response(choices)


class AssignRepresentativeView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        constituency = Constituency.objects.filter(id=pk).first()
        if not constituency:
            return Response({'error': 'Constituency not found.'}, status=status.HTTP_404_NOT_FOUND)

        user_id = request.data.get('representative')  # None/null clears the assignment

        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

            already_assigned = Constituency.objects.filter(representative=user).exclude(id=pk).first()
            if already_assigned:
                return Response(
                    {'error': f'This user is already the representative for {already_assigned.name}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            constituency.representative = user
        else:
            constituency.representative = None

        constituency.save()
        return Response(ConstituencySerializer(constituency).data)




class RepresentativeListCreateView(generics.ListCreateAPIView):
    queryset = Representative.objects.select_related(
        "user_profile",
        "constituency"
    ).all()

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
        output = RepresentativeSerializer(
            representative,
            context={"request": request}
        )

        return Response(
            output.data,
            status=status.HTTP_201_CREATED
        )


class RepresentativeDetailView(generics.RetrieveDestroyAPIView):
    queryset = Representative.objects.select_related("user_profile", "constituency").all()
    serializer_class = RepresentativeSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        user_profile = instance.user_profile
        user_profile.role = "user"
        user_profile.save(update_fields=["role"])
        instance.delete()


class RepresentativesByConstituencyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, constituency_id):
        rep = Representative.objects.select_related("user_profile", "constituency").filter(
            constituency_id=constituency_id
        ).first()
        if not rep:
            return Response(None, status=status.HTTP_200_OK)
        return Response(RepresentativeSerializer(rep).data)


class AddDepartmentAPIView(CreateAPIView):
    queryset = Dept.objects.all()
    serializer_class = AddDepartmentSerializer
    permission_classes = [IsAuthenticated]

class DepartmentListAPIView(ListAPIView):
    queryset = Dept.objects.select_related("user_profile__user").all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]



class DepartmentDetailAPIView(RetrieveAPIView):
    queryset = Dept.objects.select_related("user_profile__user").all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]




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

# -------- / Dept Profile \ -------- #
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

from .models import Dept
from .serializers import DeptProfileSerializer


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


# -------- / Dept Change Password \ -------- #
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


class DeptAddBranchAPIView(CreateAPIView):
    queryset = Branch.objects.all()
    serializer_class = DeptAddBranchSerializer
    permission_classes = [IsAuthenticated]



class DeptBranchListAPIView(ListAPIView):
    serializer_class = DeptBranchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Branch.objects.filter(deptid__user_profile__user=self.request.user)



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