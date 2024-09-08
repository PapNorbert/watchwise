import faker
import bcrypt


fake = faker.Faker()


def generate_user():
  first_name = fake.first_name()
  last_name = fake.last_name()
  return {
    'first_name': first_name,
    'last_name': last_name,
    'username': first_name.lower() + last_name.lower(),
    'role': 'user',
    'about_me': fake.text(80),
    'create_date': fake.date_time_this_century().isoformat(),
    'password': hash_password(fake.password())
  }

def hash_password(password):
  return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())


