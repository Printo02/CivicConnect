from rest_framework import serializers
from .models import UserDetail,District
from django.contrib.auth.models import User


####################################### Registration #######################################
class RegistrationSerializers(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ['first_name','email','password']
    
  def validate(self,data):
    spl_chars = '!#$%^&*()-+_=[]|;.<>?/'
    if any(ch in spl_chars for ch in data['first_name']):
      raise serializers.ValidationError("Name should not have any special characters !!")
    
    
    if not data['first_name']:
      raise serializers.ValidationError("Please enter name !!")


    if not data['email']:
      raise serializers.ValidationError("Please enter email !!")
    elif data['email']:
      if User.objects.filter(email=data['email']).exists():
        raise serializers.ValidationError("This email already exists")



    return data
    
  def create(self,validate_data):
    user = User.objects.create(username=validate_data['email'],first_name=validate_data['first_name'],email=validate_data['email'])
    user.set_password(validate_data['password'])
    user.save()
    return validate_data
    
    

####################################### Login #######################################
class LoginSerializers(serializers.Serializer):
  email = serializers.EmailField()
  password = serializers.CharField()

  def validate(self,data):
    email = data.get('email')
    password = data.get('password')
    try:
      user = User.objects.get(email=data['email'])
    except User.DoesNotExist:
      raise serializers.ValidationError("No user exists please register.....")
    if not user.check_password(password):
      raise serializers.ValidationError("Invalid password .....")
    
    data['user'] = user
    return data



####################################### ADMIN #######################################
class AdminProfileUpdateSerializers(serializers.Serializer):
  class meta:
    pass



class AdminProfileSerializers(serializers.ModelSerializer):
  class Meta:
    model = UserDetail
    fields = '__all__'


class AdminUserViewSerializers(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ['id','first_name','email','is_active','date_joined','is_staff']
  



####################################### ADMIN #######################################
####################################### ADMIN #######################################
####################################### ADMIN #######################################





####################################### District ####################################
class DistrictSerializer(serializers.ModelSerializer):
  class Meta:
    model = District
    fields = '__all__'
  




