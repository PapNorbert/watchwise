import hashlib
import faker
import os
from dotenv import load_dotenv

load_dotenv()
user_role_code = os.getenv('USER_ROLE_CODE')

fake = faker.Faker()


def generate_users(users):
    users_list = []
    for user in users:
        current_user = generate_user(user)
        users_list.append(current_user)
    return users_list


def generate_user(user):
    first_name = fake.first_name()
    last_name = fake.last_name()
    return {
        '_key': user,
        'first_name': first_name,
        'last_name': last_name,
        'username': first_name.lower() + last_name.lower(),
        'role': user_role_code,
        'about_me': fake.text(80),
        'create_date': fake.date_time_this_century().isoformat(),
        'password': hash_password()
    }


def hash_password():
    random_bytes = os.urandom(16)
    return hashlib.sha256(random_bytes).hexdigest()
