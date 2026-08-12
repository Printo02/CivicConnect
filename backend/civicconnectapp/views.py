from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import BasePermission, AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .serializers import *
from django.contrib.auth.models import User 
from .models import UserDetail,District, Dept, DeptDetails, Complaint, DeptEmployees
from .permissions import IsDeptEmployee



####################################### Permission #######################################
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'userdetails') and
            request.user.userdetails.role == 'admin'
        )




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
    
    


####################################### ADMIN #######################################



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
    def get(self,request):
        obj = User.objects.all().order_by('-date_joined')
        user = obj.filter(is_staff=False)
        serializer = AdminUserViewSerializers(user,many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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
    
    
    
    
    
    
####################################### Departments #######################################
