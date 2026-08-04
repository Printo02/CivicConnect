from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import AdminUserViewSerializers, RegistrationSerializers,LoginSerializers,DistrictSerializer
from rest_framework.views import APIView
from .models import UserDetail,District
from django.contrib.auth.models import User 


####################################### Registration #######################################
class RegisterAPI(APIView):
  def post(self,request):
    data = request.data
    serializer = RegistrationSerializers(data=data)
    if not serializer.is_valid():
      return Response({"message": serializer.errors},status=status.HTTP_404_NOT_FOUND) 
      
    
    serializer.save()
    return Response({"message": "Registered Successfully.. Please Login"},status=status.HTTP_201_CREATED) 

####################################### Login #######################################
class LoginAPI(APIView):
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
class AdminUserViewAPI(APIView):
    def get(self,request):
        obj = User.objects.all().order_by('-date_joined')
        user = obj.filter(is_staff=False)
        serializer = AdminUserViewSerializers(user,many=True)
        return Response(serializer.data)


