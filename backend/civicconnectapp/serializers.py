from rest_framework import serializers
# from .models import UserDetails
from django.contrib.auth.models import User


############# Registration #############
class RegistrationSerializers(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ['first_name','email','password',]
    
    def validate(self,data):
      spl_chars = '!#$%^&*()-+_=[]|;.<>?/'
      if any(s in spl_chars for s in data['first_name']):
        raise serializers.ValidationError("Name should not have any special characters !!")
      
      
      if not data['first_name']:
        raise serializers.ValidationError("Please enter name !!")
      
      
      if not data['email']:
        raise serializers.ValidationError("Please enter email !!")
      
      if data['email']:
        if User.objects.filter(email=data['email']).exists():
          raise serializers.ValidationError("This email already exists")

      return data
    
    def create(self,validate_data):
      user = User.objects.create(first_name=validate_data['first_name'],email=validate_data['email'])
      user.set_password(validate_data['password'])
      user.save()
      return validate_data
    
    
############# UserDetails #############
