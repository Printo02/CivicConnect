from django.shortcuts import render
from .serializers import RegistrationSerializers 
from rest_framework.views import APIView


# Registration
class RegisterAPI(APIView):
  
  serializer = RegistrationSerializers
  pass



# Login
