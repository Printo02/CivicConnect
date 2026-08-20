from rest_framework import serializers
from .models import *
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User
from .utils import generate_dept_email

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
# class AdminUserViewSerializers(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ['id','first_name','email','is_active','date_joined','is_staff']



class AdminUserViewSerializers(serializers.ModelSerializer):

    user_profile_id = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'first_name',
            'email',
            'is_active',
            'date_joined',
            'is_staff',
            'user_profile_id',
            'role',
        ]

    def get_user_profile_id(self, obj):
        return (
            UserDetail.objects
            .filter(user_id=obj.id)
            .values_list('id', flat=True)
            .first()
        )

    def get_role(self, obj):
        return (
            UserDetail.objects
            .filter(user_id=obj.id)
            .values_list('role', flat=True)
            .first()
        )

    def get_user_profile_id(self, obj):
        profile = UserDetail.objects.filter(
            user=obj
        ).first()

        return profile.id if profile else None

    def get_role(self, obj):
        profile = UserDetail.objects.filter(
            user=obj
        ).first()

        return profile.role if profile else None


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
class DeptCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dept
        fields = ["id", "deptname", "email", "is_active"]
        read_only_fields = ["email", "is_active"]

    def create(self, validated_data):
        deptname = validated_data.get("deptname")
        return Dept.objects.create(deptname=deptname)


class DeptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dept
        fields = ["id", "deptname", "email", "is_active"]


class DeptChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        dept = self.context["dept"]
        if not dept.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def save(self, **kwargs):
        dept = self.context["dept"]
        dept.set_password(self.validated_data["new_password"])
        dept.save()
        return dept





class ConstituencySerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.dname', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    representative_name = serializers.CharField(source='representative.first_name', read_only=True)
    representative_email = serializers.CharField(source='representative.email', read_only=True)

    class Meta:
        model = Constituency
        fields = [
            'id', 'name', 'ward_name_no', 'type', 'type_display', 'district', 'district_name',
            'representative', 'representative_name', 'representative_email',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class ConstituencyTypeChoicesSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()



class AddRepresentativeSerializer(serializers.ModelSerializer):
    user_profile = serializers.PrimaryKeyRelatedField(queryset=UserDetail.objects.filter(role="user"))
    constituency = serializers.PrimaryKeyRelatedField(queryset=Constituency.objects.filter(is_active=True))

    class Meta:
        model = Representative
        fields = [
            "user_profile",
            "constituency",
        ]

    def validate_user_profile(self, value):
        if Representative.objects.filter(user_profile=value).exists():
            raise serializers.ValidationError("This user is already assigned as a representative.")
        return value

    def validate_constituency(self, value):
        if Representative.objects.filter(constituency=value).exists():
            raise serializers.ValidationError("This constituency already has a representative.")
        return value

    def create(self, validated_data):
        user_profile = validated_data["user_profile"]
        user_profile.role = "rep"
        user_profile.save(update_fields=["role"])
        representative = Representative.objects.create(**validated_data)
        return representative


class RepresentativeSerializer(serializers.ModelSerializer):
    user_profile = serializers.PrimaryKeyRelatedField(
        queryset=UserDetail.objects.filter(role="user")
    )

    user_name = serializers.CharField(
        source="user_profile.first_name",
        read_only=True
    )

    user_email = serializers.EmailField(
        source="user_profile.email",
        read_only=True
    )

    constituency_name = serializers.CharField(
        source="constituency.name",
        read_only=True
    )

    constituency_ward = serializers.CharField(
        source="constituency.ward_name_no",
        read_only=True
    )

    constituency_type = serializers.CharField(
        source="constituency.type",
        read_only=True
    )

    district_name = serializers.CharField(
        source="constituency.district.dname",
        read_only=True
    )

    class Meta:
        model = Representative
        fields = [
            "id",
            "user_profile",
            "user_name",
            "user_email",
            "constituency",
            "constituency_name",
            "constituency_ward",
            "constituency_type",
            "district_name",
            "start_date",
            "end_date",
            "is_current",
        ]

    def validate_user_profile(self, value):
        if Representative.objects.filter(
            user_profile=value
        ).exists():
            raise serializers.ValidationError(
                "This user is already a representative."
            )

        return value