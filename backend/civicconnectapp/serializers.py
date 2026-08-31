from rest_framework import serializers
from .models import *
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User
from .utils import generate_dept_email
from django.db import transaction


####################################### COMMON PAGES  #######################################


# ------------------- Registration ------------------- #
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



# ------------------- Login ------------------- #
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

# ------------------- District ------------------- #
class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = '__all__'



####################################### ADMIN MODULE #######################################

# ------------------- ADMIN - View Users ------------------- #
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


# ------------------- ADMIN: Profile ------------------- #
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



# -------------------  ADMIN: change password ------------------- #
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data


# -------------------  ADMIN:  ------------------- #
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dept
        fields = "__all__"


# -------------------  ADMIN:  ------------------- #
class DepartmentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user_profile.user.email",read_only=True)
    user_id = serializers.IntegerField(source="user_profile.user.id",read_only=True)
    role = serializers.CharField(source="user_profile.role",read_only=True)
    class Meta:
        model = Dept
        fields = ["id","user_id","deptname","deptadv","email","role"]


# -------------------  ADMIN:  ------------------- #
class AddDepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dept
        fields = ["id","deptname","deptadv"]

    def validate_deptname(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Department name is required.")
        if Dept.objects.filter(deptname__iexact=value).exists():
            raise serializers.ValidationError("This department already exists.")
        return value

    def validate_deptadv(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Department abbreviation is required.")
        if Dept.objects.filter(deptadv__iexact=value).exists():
            raise serializers.ValidationError("This abbreviation is already in use.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        deptname = validated_data["deptname"]
        deptadv = validated_data["deptadv"]
        # Generate department email
        email = f"{deptadv.lower()}@civicconnect.com"
        # Make sure generated email is unique
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"deptadv": "This abbreviation already has an account."})
        # Create Django User
        user = User.objects.create_user(username=email,email=email,password=email,first_name=deptname,last_name=deptadv)
        # Create UserDetail
        user_detail = UserDetail.objects.create(user=user,role="dept")
        # Create Department
        department = Dept.objects.create(user_profile=user_detail,deptname=deptname,deptadv=deptadv)
        return department


# -------------------  ADMIN:  ------------------- #
class DeptCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dept
        fields = ["id", "deptname", "email", "is_active"]
        read_only_fields = ["email", "is_active"]

    def create(self, validated_data):
        deptname = validated_data.get("deptname")
        return Dept.objects.create(deptname=deptname)


# -------------------  ADMIN:  ------------------- #
class DeptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dept
        fields = ["id", "deptname", "email", "is_active"]


# -------------------  ADMIN:  ------------------- #
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



# -------------------  ADMIN:  ------------------- #
class ConstituencySerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source="district.dname",read_only=True)
    type_display = serializers.CharField(source="get_type_display",read_only=True)
    representative_id = serializers.SerializerMethodField()
    representative_name = serializers.SerializerMethodField()
    representative_email = serializers.SerializerMethodField()

    class Meta:
        model = Constituency
        fields = [
            "id",
            "name",
            "ward_name_no",
            "type",
            "type_display",
            "district",
            "district_name",
            "representative_id",
            "representative_name",
            "representative_email",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def _get_representative(self, obj):
        return (obj.constituency.filter(is_current=True).select_related("user_profile__user").first())

    def get_representative_id(self, obj):
        representative = self._get_representative(obj)
        if not representative:
            return None
        return representative.user_profile.user.id

    def get_representative_name(self, obj):
        representative = self._get_representative(obj)
        if not representative:
            return None
        return representative.user_profile.user.first_name

    def get_representative_email(self, obj):
        representative = self._get_representative(obj)
        if not representative:
            return None
        return representative.user_profile.user.email


# -------------------  ADMIN:  ------------------- #
class ConstituencyTypeChoicesSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


# -------------------  ADMIN:  ------------------- #
class AddRepresentativeSerializer(serializers.ModelSerializer):
    user_profile = serializers.PrimaryKeyRelatedField(queryset=UserDetail.objects.filter(role="user"))
    constituency = serializers.PrimaryKeyRelatedField(queryset=Constituency.objects.filter(is_active=True),required=False,
        allow_null=True)
    class Meta:
        model = Representative
        fields = [
            "user_profile",
            "constituency",
            "start_date",
            "end_date",
        ]

    def validate_user_profile(self, value):
        if Representative.objects.filter(user_profile=value).exists():
            raise serializers.ValidationError("This user is already a representative.")
        return value

    def validate_constituency(self, value):
        if value and Representative.objects.filter(constituency=value).exists():
            raise serializers.ValidationError("This constituency already has a representative.")
        return value

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date:
            if start_date > end_date:
                raise serializers.ValidationError({"end_date":"End date cannot be before start date."})
        return attrs

    def create(self, validated_data):
        user_profile = validated_data["user_profile"]
        user_profile.role = "representative"
        user_profile.save(update_fields=["role"])
        representative = Representative.objects.create(**validated_data)
        # Keep both sides synchronized
        constituency = representative.constituency
        if constituency:
            constituency.representative = (user_profile.user)
            constituency.save(update_fields=["representative"])
        return representative



# -------------------  ADMIN:  ------------------- #
class RepresentativeSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user_profile.user.first_name",read_only=True)
    user_email = serializers.EmailField(source="user_profile.user.email",read_only=True)
    constituency_name = serializers.CharField(source="constituency.name",read_only=True)
    constituency_ward = serializers.CharField(source="constituency.ward_name_no",read_only=True)
    constituency_type = serializers.CharField(source="constituency.type",read_only=True)
    district_name = serializers.CharField(source="constituency.district.dname",read_only=True)

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


# -------------------  ADMIN:  ------------------- #
class RepresentativeAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Representative
        fields = [
            "constituency",
            "start_date",
            "end_date",
            "is_current",
        ]

        read_only_fields = [
            "is_current",
        ]
        
    def validate(self, attrs):
        start_date = attrs.get("start_date",self.instance.start_date)
        end_date = attrs.get("end_date",self.instance.end_date)
        if start_date and end_date:
            if start_date > end_date:
                raise serializers.ValidationError({"end_date":"End date cannot be before start date."})
        return attrs








####################################### DEPARTMENT MODULE #######################################'
# ------------------- DEPARTMENT: Profile ------------------- #
class DeptProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user_profile.user.first_name",required=False)
    email = serializers.EmailField(source="user_profile.user.email",read_only=True)
    role = serializers.CharField(source="user_profile.role",read_only=True)
    user_id = serializers.IntegerField(source="user_profile.user.id",read_only=True)

    class Meta:
        model = Dept
        fields = [
            "id","user_id","name","email","deptname","deptadv","phone","location",
            "website","urls","is_active","placename","created_at","role"
        ]
        read_only_fields = ["id","user_id","email","role","is_active","created_at"]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user_profile", {})
        user = instance.user_profile.user
        if "first_name" in user_data:
            user.first_name = user_data["first_name"]
            user.save(update_fields=["first_name"])
        return super().update(instance, validated_data)



# ------------------- DEPARTMENT: change password ------------------- #
class DeptChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data
    

# -------------------  DEPARTMENT: add branches ------------------- #
class DeptBranchSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user_details.user.email", read_only=True)
    user_id = serializers.IntegerField(source="user_details.user.id", read_only=True)
    role = serializers.CharField(source="user_details.role", read_only=True)
    district_name = serializers.CharField(source="district.dname", read_only=True)

    class Meta:
        model = Branch
        fields = [
            "id", "deptid", "user_id", "branch_name", "placename",
            "district", "district_name", "email", "role", "is_active",
        ]


# -------------------  DEPARTMENT:  ------------------- #
class DeptAddBranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id","branch_name","placename","district"]

    @transaction.atomic
    def create(self, validated_data):
        branch_name = validated_data["branch_name"]
        placename = validated_data.get("placename", "")
        x = branch_name.strip()
        y = placename.strip()
        check = f"{x}{y}"
        email = f"{check.lower()}@civicconnect.com"

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "An account with this generated email already exists."})

        user = User.objects.create_user(username=email, email=email, password=email, first_name=check)
        user_detail = UserDetail.objects.create(user=user, role="branch")

        request = self.context["request"]
        logged_in_user = request.user

        try:
            dept = Dept.objects.get(user_profile__user=logged_in_user)
        except Dept.DoesNotExist:
            raise serializers.ValidationError({"detail": "No department account found for this login."})

        branch = Branch.objects.create(user_details=user_detail,deptid=dept,**validated_data)
        return branch


# -------------------  DEPARTMENT:  ------------------- #
class DeptEditBranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "branch_name", "placename", "district"]
        read_only_fields = ["id"]

    def validate_placename(self, value):
        value = value.strip() if value else value
        if not value:
            raise serializers.ValidationError("Place name is required.")
        return value






####################################### BRANCH MODULE #######################################
# ------------------- BRANCH: Profile ------------------- #
class BranchProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user_details.user.first_name",required=False)
    email = serializers.EmailField(source="user_details.user.email",read_only=True)
    role = serializers.CharField(source="user_details.role",read_only=True)
    user_id = serializers.IntegerField(source="user_details.user.id",read_only=True)
    deptname = serializers.CharField(source="deptid.deptname",read_only=True)
    class Meta:
        model = Branch
        fields = [
            "id","user_id","name","deptname","email","branch_name","phone","location",
            "website","urls","is_active","placename","created_at","role",
        ]
        read_only_fields = ["id","user_id","deptname","branch_name","email","role","is_active","created_at"]

    def update(self, instance, validated_data):
        user_details_data  = validated_data.pop("user_details", {})
        user_data = user_details_data.get("user", {})
        if "first_name" in user_data:
            user = instance.user_details.user
            user.first_name = user_data["first_name"]
            user.save(update_fields=["first_name"])
    
        return super().update(instance, validated_data)



# ------------------- BRANCH: change password ------------------- #
class BranchChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data



# ------------------- BRANCH: Branch Employee  ------------------- #
class AddBranchEmployeeSerializer(serializers.ModelSerializer):
    fullname = serializers.CharField(write_only=True,required=True)
    branch = serializers.CharField(source="branch_details.branch_name",read_only=True)
    placename = serializers.CharField(source="branch_details.placename",read_only=True)
    emp_name = serializers.CharField(source="user_details.first_name",read_only=True)
    email = serializers.CharField(source="user_details.email",read_only=True)

    class Meta:
        model = BranchEmployees
        fields = [
            "id",
            "fullname",
            "branch",
            "emp_name",
            "placename",
            "email"
        ]

    def validate_fullname(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Employee name is required.")
        return value

    @transaction.atomic
    def create(self, validated_data):

        # 1. Get employee name
        fullname = validated_data.pop("fullname")

        # 2. Get branch from logged-in Branch Admin
        branch = self.context.get("branch")

        if not branch:
            raise serializers.ValidationError({"branch": "Branch was not found."})

        # 3. Generate email using:
        fullname_part = "".join(
            character
            for character in fullname.lower()
            if character.isalnum()
        )

        branch_part = "".join(
            character
            for character in branch.branch_name.lower()
            if character.isalnum()
        )
        place_part = "".join(character for character in branch.placename.lower()
            if character.isalnum()
        )

        if not fullname_part:
            raise serializers.ValidationError({"fullname": "Enter a valid employee name."})

        if not branch_part:
            raise serializers.ValidationError({"branch": "Branch name is required."})
            
        if not place_part:
            raise serializers.ValidationError({"placename": "Branch name is required."})

        email_name = f"{fullname_part}{branch_part}{place_part}"

        email = f"{email_name}@civicconnect.com"

        # 4. Make email/username unique
        counter = 1

        while (User.objects.filter(username=email).exists()
            or
            User.objects.filter(email__iexact=email).exists()):

            email = (f"{email_name}{counter}" f"@civicconnect.com")

            counter += 1

        # 5. Password = generated email
        password = email

        # 6. Create Django User
        user = User.objects.create_user(username=email,email=email,password=password,first_name=fullname)

        # 7. Create UserDetail
        UserDetail.objects.create(user=user,role="BranchEmployee")

        # 8. Create BranchEmployees
        employee = BranchEmployees.objects.create(branch_details=branch,user_details=user)

        return employee











####################################### USER MODULE #######################################

# -------------------  Profile  ------------------- #
class UserProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.first_name",required=False)
    email = serializers.EmailField(source="user.email",read_only=True)
    user_id = serializers.IntegerField(source="user.id",read_only=True)
    class Meta:
        model = UserDetail
        fields = [
            "id",
            "user_id",
            "name",
            "email",
            "phone",
            "dob",
            "address",
            "image",
            "role",
        ]

        read_only_fields = [
            "id",
            "user_id",
            "email",
            "role",
            "is_active",
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if "first_name" in user_data:
            instance.user.first_name = user_data["first_name"]
            instance.user.save(update_fields=["first_name"])
        return super().update(instance, validated_data)


# ------------------- Change Password ------------------- #
class UserChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True,validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data






####################################### REPRESENTATIVE MODULE #######################################

# ------------------- Representative Profile ------------------- #
class RepresentativeProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user_profile.user.id",read_only=True)
    name = serializers.CharField(source="user_profile.user.first_name",required=False)
    email = serializers.EmailField(source="user_profile.user.email",read_only=True)
    phone = serializers.CharField(source="user_profile.phone",required=False,allow_blank=True)
    dob = serializers.DateField(source="user_profile.dob",required=False,allow_null=True)
    address = serializers.CharField(source="user_profile.address",required=False,allow_blank=True)
    image = serializers.ImageField(source="user_profile.image",required=False,allow_null=True)
    role = serializers.CharField(source="user_profile.role",read_only=True)
    constituency_name = serializers.CharField(source="constituency.name",read_only=True)

    class Meta:
        model = Representative
        fields = [
            "id",
            "user_id",
            "name",
            "email",
            "phone",
            "dob",
            "address",
            "image",
            "role",
            "constituency",
            "constituency_name",
            "start_date",
            "end_date",
            "is_current",
        ]

        read_only_fields = [
            "id",
            "user_id",
            "email",
            "role",
            "constituency_name",
        ]

    def update(self, instance, validated_data):
        user_profile_data = validated_data.pop("user_profile",{})
        user_data = user_profile_data.pop("user",{})
        # Update Django User
        if "first_name" in user_data:
            instance.user_profile.user.first_name = user_data["first_name"]
            instance.user_profile.user.save(update_fields=["first_name"])
        # Update UserDetail
        for field, value in user_profile_data.items():
            setattr(instance.user_profile,field,value)
        instance.user_profile.save()
        # Update Representative
        return super().update(instance,validated_data)



# ------------------- Change Password ------------------- #
class RepresentativeChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True,validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


# -------------------  Constituency ------------------- #

class RepresentativeConstituencySerializer(serializers.ModelSerializer):
    constituency_name = serializers.CharField(source="constituency.name",read_only=True)
    ward_name_no = serializers.CharField(source="constituency.ward_name_no",read_only=True)
    constituency_type = serializers.CharField(source="constituency.get_type_display",read_only=True)
    district_name = serializers.CharField(source="constituency.district.dname",read_only=True)

    class Meta:
        model = Representative

        fields = [
            "id",
            "constituency",
            "constituency_name",
            "ward_name_no",
            "constituency_type",
            "district_name",
            "start_date",
            "end_date",
            "is_current",
        ]

        read_only_fields = [
            "id",
            "constituency",
            "constituency_name",
            "ward_name_no",
            "constituency_type",
            "district_name",
            "start_date",
            "end_date",
            "is_current",
        ]






####################################### BRANCH-EMPLOYEE MODULE #######################################

