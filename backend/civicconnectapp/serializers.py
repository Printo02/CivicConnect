from rest_framework import serializers
from .models import UserDetail,District, Dept, DeptDetails, Complaint ,DeptEmployees
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User


####################################### Registration #######################################

class RegistrationSerializers(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True} }

    def validate(self, data):
        special_chars = '!#$%^&*()-+_=[]|;.<>?/'

        if not data.get('first_name'):
            raise serializers.ValidationError("Please enter name !!")

        if any(ch in special_chars for ch in data['first_name']):
            raise serializers.ValidationError("Name should not have any special characters !!")

        if not data.get('email'):
            raise serializers.ValidationError("Please enter email !!")

        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("This email already exists")

        return data

    def create(self, validated_data):
        # Create User
        user = User.objects.create(username=validated_data['email'],first_name=validated_data['first_name'],email=validated_data['email'])
        # Hash password
        user.set_password(validated_data['password'])
        user.save()
        # Create UserDetail
        UserDetail.objects.create(user=user)
        return user




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
class AdminUserViewSerializers(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ['id','first_name','email','is_active','date_joined','is_staff']
    

class ProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.first_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    class Meta:
        model = UserDetail
        fields = ['name', 'email', 'phone', 'dob', 'address', 'image', 'role']
        read_only_fields = ['role']  

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if 'first_name' in user_data:
            instance.user.first_name = user_data['first_name']
        if 'email' in user_data:
            instance.user.email = user_data['email']
        instance.user.save()

        return super().update(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data



class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dept
        fields = "__all__"



class DeptDetailsSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source="region.dname", read_only=True)
    dept_name = serializers.CharField(source="dept.deptname", read_only=True)
    
    class Meta:
        model = DeptDetails
        fields = [
            "id",
            # "dept",
            "dept_name",
            "phone",
            "email",
            "location",
            "website",
            "urls",
            "region",
            "region_name",
            "is_verified",
            "created_at",
        ]



####################################### District ####################################
class DistrictSerializer(serializers.ModelSerializer):
  class Meta:
    model = District
    fields = '__all__'
  


####################################### DEPARTMENT #######################################

