// Tests MUST run against a dedicated database. The suite drops the database
// after every test, so pointing it at the dev database would wipe real data.
process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/househunt_test';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

beforeAll(async () => {
  // Ensure both the app-under-test and the test connection share the test DB
  process.env.MONGODB_URI =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/househunt_test';
});

beforeEach(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/househunt');
});

afterEach(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('HouseHunt Backend API Tests', () => {
  describe('Health Check', () => {
    test('GET /health should return status OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('househunt-api');
    });
  });

  describe('Authentication', () => {
    test('POST /api/v1/auth/register should create new user', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: `test.user.${Date.now()}@example.com`,
        password: 'TestPassword123'
      };
      const response = await request(app).post('/api/v1/auth/register').send(userData);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);

      // Verify user is actually persisted in MongoDB
      const dbUser = await mongoose.model('User').findOne({ email: userData.email });
      expect(dbUser).toBeTruthy();
      expect(dbUser.firstName).toBe('Test');
      expect(dbUser.lastName).toBe('User');
      expect(dbUser.email).toBe(userData.email);
      expect(dbUser.password).not.toBe(userData.password);
      expect(dbUser.password).toBeDefined();
    });

    test('POST /api/v1/auth/login should login user', async () => {
      const userData = {
        firstName: 'Login',
        lastName: 'TestUser',
        email: `login.test.${Date.now()}@example.com`,
        password: 'LoginPassword123'
      };
      await request(app).post('/api/v1/auth/register').send(userData);
      const response = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);

      // Verify user is actually persisted in MongoDB
      const dbUser = await mongoose.model('User').findOne({ email: userData.email });
      expect(dbUser).toBeTruthy();
      expect(dbUser.role).toBe('user');
    });

    test('POST /api/v1/auth/login should reject invalid credentials', async () => {
      const userData = {
        firstName: 'Invalid',
        lastName: 'User',
        email: `invalid.${Date.now()}@example.com`,
        password: 'InvalidPassword123'
      };
      await request(app).post('/api/v1/auth/register').send(userData);
      const response = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: 'WrongPassword'
      });
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/v1/auth/login should reject malformed authentication', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({});
      expect(response.status).toBe(400);
    });
  });

  describe('Authorization', () => {
    test('Protected endpoint without token should return 401', async () => {
      const response = await request(app).get('/api/v1/users/me');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Protected endpoint with invalid token should return 401', async () => {
      const response = await request(app).get('/api/v1/users/me').set('Authorization', 'Bearer invalid_token');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Protected endpoint with valid user authentication should succeed', async () => {
      const userData = {
        firstName: 'Authorized',
        lastName: 'User',
        email: `authorized.${Date.now()}@example.com`,
        password: 'AuthorizedPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      const meResponse = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
      expect(meResponse.status).toBe(200);
      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.user.email).toBe(userData.email);
    });

    test('Normal user attempting admin-only endpoint should return 403', async () => {
      const userData = {
        firstName: 'NormalUser',
        lastName: 'Test',
        email: `normal.user.${Date.now()}@example.com`,
        password: 'NormalPassword123',
        role: 'user'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      const adminResponse = await request(app).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${token}`);
      expect(adminResponse.status).toBe(403);
      expect(adminResponse.body.success).toBe(false);
    });
  });

  describe('Properties', () => {
    test('Should create property', async () => {
      const userData = {
        firstName: 'PropertyOwner',
        lastName: 'Test',
        email: `owner.${Date.now()}@example.com`,
        password: 'OwnerPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Beautiful House',
        description: 'A wonderful house for rent',
        propertyType: 'House',
        listingType: 'Rent',
        price: 2500,
        bedrooms: 3,
        bathrooms: 2,
        area: 1500,
        amenities: ['WiFi', 'Parking', 'Air Conditioning'],
        owner: registerResponse.body.user._id
      };
      const propertyResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(propertyResponse.status).toBe(201);
      expect(propertyResponse.body.title).toBe(propertyData.title);

      const dbProperty = await mongoose.model('Property').findById(propertyResponse.body._id);
      expect(dbProperty).toBeTruthy();
      expect(dbProperty.title).toBe(propertyData.title);
    });

    test('Should retrieve property', async () => {
      const userData = {
        firstName: 'Retriever',
        lastName: 'Test',
        email: `retriever.${Date.now()}@example.com`,
        password: 'RetrieverPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'House for Rent',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1500,
        bedrooms: 2,
        bathrooms: 1,
        area: 1200,
        status: 'published',
        owner: registerResponse.body.user._id
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(createResponse.status).toBe(201);
      const propertyId = createResponse.body._id;

      const getResponse = await request(app).get(`/api/v1/properties/${propertyId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.title).toBe(propertyData.title);
    });

    test('Should retrieve property list', async () => {
      const userData = {
        firstName: 'Lister',
        lastName: 'Test',
        email: `lister.${Date.now()}@example.com`,
        password: 'ListerPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      for (let i = 0; i < 3; i++) {
        const propertyData = {
          title: `Property ${i + 1}`,
          description: `Description ${i + 1}`,
          propertyType: 'House',
          listingType: 'Rent',
          price: 1000 + i * 100,
          bedrooms: 2,
          bathrooms: 1,
          area: 1000,
          status: 'published',
          owner: registerResponse.body.user._id
        };
        await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      }

      const listResponse = await request(app).get('/api/v1/properties');
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.length).toBe(3);
    });

    test('Should update property', async () => {
      const userData = {
        firstName: 'Updater',
        lastName: 'Test',
        email: `updater.${Date.now()}@example.com`,
        password: 'UpdaterPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Original Title',
        description: 'Original Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: registerResponse.body.user._id
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(createResponse.status).toBe(201);
      const propertyId = createResponse.body._id;

      const updateData = {
        title: 'Updated Title',
        price: 1200
      };
      const updateResponse = await request(app).patch(`/api/v1/properties/${propertyId}`).send(updateData).set('Authorization', `Bearer ${token}`);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.title).toBe('Updated Title');
      expect(updateResponse.body.price).toBe(1200);
    });

    test('Should delete property', async () => {
      const userData = {
        firstName: 'Deleter',
        lastName: 'Test',
        email: `deleter.${Date.now()}@example.com`,
        password: 'DeleterPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Property to Delete',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: registerResponse.body.user._id
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(createResponse.status).toBe(201);
      const propertyId = createResponse.body._id;

      const deleteResponse = await request(app).delete(`/api/v1/properties/${propertyId}`).set('Authorization', `Bearer ${token}`);
      expect(deleteResponse.status).toBe(204);

      const dbProperty = await mongoose.model('Property').findById(propertyId);
      expect(dbProperty).toBeNull();
    });

    test('Should reject invalid property input', async () => {
      const userData = {
        firstName: 'Invalid',
        lastName: 'Tester',
        email: `invalid.${Date.now()}@example.com`,
        password: 'InvalidPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const token = registerResponse.body.token;

      const invalidPropertyData = {
        title: '',
        description: '',
        propertyType: 'InvalidType',
        listingType: 'Rent',
        price: -100,
        bedrooms: 0,
        bathrooms: -1,
        area: 0,
        owner: registerResponse.body.user._id
      };
      const response = await request(app).post('/api/v1/properties').send(invalidPropertyData).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
    });

    test('Should search/filter properties', async () => {
      const userData = {
        firstName: 'Searcher',
        lastName: 'Test',
        email: `searcher.${Date.now()}@example.com`,
        password: 'SearcherPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const properties = [
        {
          title: 'House A',
          description: 'Description A',
          propertyType: 'House',
          listingType: 'Rent',
          price: 1000,
          bedrooms: 2,
          bathrooms: 1,
          area: 1000,
          status: 'published',
          owner: registerResponse.body.user._id
        },
        {
          title: 'House B',
          description: 'Description B',
          propertyType: 'House',
          listingType: 'Rent',
          price: 1500,
          bedrooms: 3,
          bathrooms: 2,
          area: 1500,
          status: 'published',
          owner: registerResponse.body.user._id
        }
      ];

      for (const prop of properties) {
        await request(app).post('/api/v1/properties').send(prop).set('Authorization', `Bearer ${token}`);
      }

      const searchResponse = await request(app).get('/api/v1/properties?price=1000&propertyType=House');
      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.data.length).toBe(1);
      expect(searchResponse.body.data[0].price).toBe(1000);
    });
  });

  describe('Favorites', () => {
    test('Should add favorite', async () => {
      const userData = {
        firstName: 'Favoriter',
        lastName: 'Test',
        email: `favoriter.${Date.now()}@example.com`,
        password: 'FavoriterPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Favorite Property',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: registerResponse.body.user._id
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(createResponse.status).toBe(201);
      const propertyId = createResponse.body._id;

      const favoriteResponse = await request(app).post(`/api/v1/favorites/${propertyId}`).set('Authorization', `Bearer ${token}`);
      expect(favoriteResponse.status).toBe(201);
      expect(favoriteResponse.body.property.toString()).toBe(propertyId);

      const dbFavorite = await mongoose.model('Favorite').findOne({ user: registerResponse.body.user._id, property: propertyId });
      expect(dbFavorite).toBeTruthy();
    });

    test('Should retrieve favorites', async () => {
      const userData = {
        firstName: 'Favoritelist',
        lastName: 'Test',
        email: `favoritelist.${Date.now()}@example.com`,
        password: 'FavoritelistPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Property for Favorites',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: registerResponse.body.user._id
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(createResponse.status).toBe(201);
      const propertyId = createResponse.body._id;

      await request(app).post(`/api/v1/favorites/${propertyId}`).set('Authorization', `Bearer ${token}`);

      const favoritesResponse = await request(app).get('/api/v1/favorites').set('Authorization', `Bearer ${token}`);
      expect(favoritesResponse.status).toBe(200);
      expect(favoritesResponse.body.data.length).toBe(1);
      expect(favoritesResponse.body.data[0]._id.toString()).toBe(propertyId);
    });

    test('Should prevent duplicate favorite', async () => {
      const userData = {
        firstName: 'Noduplicate',
        lastName: 'Test',
        email: `noduplicate.${Date.now()}@example.com`,
        password: 'NoduplicatePassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Property',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: registerResponse.body.user._id
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(createResponse.status).toBe(201);
      const propertyId = createResponse.body._id;

      await request(app).post(`/api/v1/favorites/${propertyId}`).set('Authorization', `Bearer ${token}`);

      const duplicateResponse = await request(app).post(`/api/v1/favorites/${propertyId}`).set('Authorization', `Bearer ${token}`);
      expect(duplicateResponse.status).toBe(400);

      const favoritesCount = await mongoose.model('Favorite').countDocuments({ user: registerResponse.body.user._id });
      expect(favoritesCount).toBe(1);
    });

    test('Should remove favorite', async () => {
      const userData = {
        firstName: 'Remover',
        lastName: 'Test',
        email: `remover.${Date.now()}@example.com`,
        password: 'RemoverPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Property to Remove',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: registerResponse.body.user._id
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(createResponse.status).toBe(201);
      const propertyId = createResponse.body._id;

      await request(app).post(`/api/v1/favorites/${propertyId}`).set('Authorization', `Bearer ${token}`);

      const removeResponse = await request(app).delete(`/api/v1/favorites/${propertyId}`).set('Authorization', `Bearer ${token}`);
      expect(removeResponse.status).toBe(200);

      const dbFavorite = await mongoose.model('Favorite').findOne({ user: registerResponse.body.user._id, property: propertyId });
      expect(dbFavorite).toBeNull();
    });

    test('Should verify favorites persistence in MongoDB', async () => {
      const userData = {
        firstName: 'Persistence',
        lastName: 'Tester',
        email: `persistence.${Date.now()}@example.com`,
        password: 'PersistencePassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Persistence Property',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: registerResponse.body.user._id
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(createResponse.status).toBe(201);
      const propertyId = createResponse.body._id;

      await request(app).post(`/api/v1/favorites/${propertyId}`).set('Authorization', `Bearer ${token}`);

      const favoritesResponse = await request(app).get('/api/v1/favorites').set('Authorization', `Bearer ${token}`);
      expect(favoritesResponse.status).toBe(200);
      expect(favoritesResponse.body.data.length).toBe(1);

      const dbFavorite = await mongoose.model('Favorite').findOne({ user: registerResponse.body.user._id, property: propertyId });
      expect(dbFavorite).toBeTruthy();
      expect(dbFavorite.user.toString()).toBe(registerResponse.body.user._id.toString());
    });
  });

  describe('Bookings', () => {
    test('Should create booking', async () => {
      const userData = {
        firstName: 'Booker',
        lastName: 'Test',
        email: `booker.${Date.now()}@example.com`,
        password: 'BookerPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      expect(registerResponse.status).toBe(201);
      const userId = registerResponse.body.user._id;
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Bookable Property',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: userId
      };
      const propertyResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(propertyResponse.status).toBe(201);
      const propertyId = propertyResponse.body._id;

      const bookingData = {
        customerId: userId,
        hostId: userId,
        listingId: propertyId,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        totalPrice: 2000
      };
      const bookingResponse = await request(app).post('/api/v1/bookings').send(bookingData).set('Authorization', `Bearer ${token}`);
      expect(bookingResponse.status).toBe(201);
      expect(bookingResponse.body.customerId.toString()).toBe(userId.toString());

      const dbBooking = await mongoose.model('Booking').findById(bookingResponse.body._id);
      expect(dbBooking).toBeTruthy();
      expect(dbBooking.customerId.toString()).toBe(userId.toString());
    });

    test('Should retrieve booking', async () => {
      const userData = {
        firstName: 'Retrieve',
        lastName: 'Booking',
        email: `retrieve.booking.${Date.now()}@example.com`,
        password: 'RetrievePassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const userId = registerResponse.body.user._id;
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Property for Booking',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: userId
      };
      const propertyResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      const propertyId = propertyResponse.body._id;

      const bookingData = {
        customerId: userId,
        hostId: userId,
        listingId: propertyId,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        totalPrice: 2000
      };
      const bookingResponse = await request(app).post('/api/v1/bookings').send(bookingData).set('Authorization', `Bearer ${token}`);
      const bookingId = bookingResponse.body._id;

      const getResponse = await request(app).get(`/api/v1/bookings/${bookingId}`).set('Authorization', `Bearer ${token}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.customerId.toString()).toBe(userId.toString());
    });

    test('Should validate invalid booking', async () => {
      const userData = {
        firstName: 'Invalid',
        lastName: 'Booking',
        email: `invalid.booking.${Date.now()}@example.com`,
        password: 'InvalidPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const userId = registerResponse.body.user._id;
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const invalidBookingData = {
        customerId: userId,
        hostId: userId,
        listingId: 'invalid_id',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        totalPrice: 2000
      };
      const response = await request(app).post('/api/v1/bookings').send(invalidBookingData).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
    });

    test('Should enforce authorization for bookings', async () => {
      const userData = {
        firstName: 'Auth',
        lastName: 'Test',
        email: `auth.test.${Date.now()}@example.com`,
        password: 'AuthPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const userId = registerResponse.body.user._id;
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Property',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: userId
      };
      const propertyResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      const propertyId = propertyResponse.body._id;

      const bookingData = {
        customerId: userId,
        hostId: userId,
        listingId: propertyId,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        totalPrice: 2000
      };
      const bookingResponse = await request(app).post('/api/v1/bookings').send(bookingData).set('Authorization', `Bearer ${token}`);
      expect(bookingResponse.status).toBe(201);

      const otherUserData = {
        firstName: 'Other',
        lastName: 'User',
        email: `other.user.${Date.now()}@example.com`,
        password: 'OtherPassword123'
      };
      const otherRegisterResponse = await request(app).post('/api/v1/auth/register').send(otherUserData);

      const unauthorizedResponse = await request(app).get(`/api/v1/bookings/${bookingResponse.body._id}`).set('Authorization', `Bearer ${otherRegisterResponse.body.token}`);
      expect(unauthorizedResponse.status).toBe(403);
    });

    test('Should prevent invalid/duplicate booking situations', async () => {
      const userData = {
        firstName: 'Duplicate',
        lastName: 'Test',
        email: `duplicate.${Date.now()}@example.com`,
        password: 'DuplicatePassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const userId = registerResponse.body.user._id;
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Property',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: userId
      };
      const propertyResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      const propertyId = propertyResponse.body._id;

      const bookingData = {
        customerId: userId,
        hostId: userId,
        listingId: propertyId,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        totalPrice: 2000
      };
      const bookingResponse = await request(app).post('/api/v1/bookings').send(bookingData).set('Authorization', `Bearer ${token}`);
      expect(bookingResponse.status).toBe(201);

      const duplicateBookingData = {
        customerId: userId,
        hostId: userId,
        listingId: propertyId,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        totalPrice: 2000
      };
      const duplicateResponse = await request(app).post('/api/v1/bookings').send(duplicateBookingData).set('Authorization', `Bearer ${token}`);
      expect(duplicateResponse.status).toBe(400);

      const dbBookings = await mongoose.model('Booking').find({ listingId: propertyId });
      expect(dbBookings.length).toBe(1);
    });

    test('Should verify bookings persistence in MongoDB', async () => {
      const userData = {
        firstName: 'Persist',
        lastName: 'Booking',
        email: `persist.booking.${Date.now()}@example.com`,
        password: 'PersistPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const userId = registerResponse.body.user._id;
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Property',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: userId
      };
      const propertyResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      const propertyId = propertyResponse.body._id;

      const bookingData = {
        customerId: userId,
        hostId: userId,
        listingId: propertyId,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        totalPrice: 2000
      };
      const bookingResponse = await request(app).post('/api/v1/bookings').send(bookingData).set('Authorization', `Bearer ${token}`);
      expect(bookingResponse.status).toBe(201);
      const bookingId = bookingResponse.body._id;

      const dbBooking = await mongoose.model('Booking').findById(bookingId);
      expect(dbBooking).toBeTruthy();
      expect(dbBooking.customerId.toString()).toBe(userId.toString());
      expect(dbBooking.listingId.toString()).toBe(propertyId.toString());
      expect(dbBooking.status).toBe('pending');
    });
  });

  describe('Admin', () => {
    test('Should allow admin-protected operations', async () => {
      const userData = {
        firstName: 'Admin',
        lastName: 'Test',
        email: `admin.${Date.now()}@example.com`,
        password: 'AdminPassword123',
        role: 'admin'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      const adminResponse = await request(app).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${token}`);
      expect(adminResponse.status).toBe(200);
      expect(adminResponse.body.success).toBe(true);
      expect(adminResponse.body.data.totalUsers).toBeGreaterThanOrEqual(1);
    });

    test('Should reject non-admin users from accessing admin endpoints', async () => {
      const userData = {
        firstName: 'NonAdmin',
        lastName: 'Test',
        email: `nonadmin.${Date.now()}@example.com`,
        password: 'NonAdminPassword123',
        role: 'user'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      const adminResponse = await request(app).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${token}`);
      expect(adminResponse.status).toBe(403);
      expect(adminResponse.body.success).toBe(false);
    });
  });

  describe('Property Search', () => {
    test('Should search properties by keyword', async () => {
      const userData = {
        firstName: 'SearchOwner',
        lastName: 'Test',
        email: `search.owner.${Date.now()}@example.com`,
        password: 'SearchOwnerPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const properties = [
        {
          title: 'Beautiful Beach Villa',
          description: 'A wonderful villa near the sea',
          propertyType: 'Villa',
          listingType: 'Rent',
          price: 3000,
          bedrooms: 4,
          bathrooms: 3,
          area: 2500,
          status: 'published',
          owner: registerResponse.body.user._id
        },
        {
          title: 'Downtown Office',
          description: 'A modern office space',
          propertyType: 'Office',
          listingType: 'Sale',
          price: 250000,
          bedrooms: 0,
          bathrooms: 2,
          area: 1800,
          status: 'published',
          owner: registerResponse.body.user._id
        }
      ];

      for (const prop of properties) {
        await request(app).post('/api/v1/properties').send(prop).set('Authorization', `Bearer ${token}`);
      }

      const searchResponse = await request(app).get('/api/v1/properties?keyword=beach');
      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.data.length).toBe(1);
      expect(searchResponse.body.data[0].title).toBe('Beautiful Beach Villa');

      const emptyResponse = await request(app).get('/api/v1/properties?keyword=zzzznomatch');
      expect(emptyResponse.status).toBe(200);
      expect(emptyResponse.body.data.length).toBe(0);
    });

    test('Should combine keyword search with filters', async () => {
      const userData = {
        firstName: 'Combined',
        lastName: 'Search',
        email: `combined.search.${Date.now()}@example.com`,
        password: 'CombinedPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const properties = [
        {
          title: 'Luxury Penthouse',
          description: 'High-end penthouse',
          propertyType: 'Apartment',
          listingType: 'Sale',
          price: 500000,
          bedrooms: 3,
          bathrooms: 3,
          area: 2200,
          status: 'published',
          owner: registerResponse.body.user._id
        },
        {
          title: 'Cozy Penthouse',
          description: 'Small penthouse for rent',
          propertyType: 'Apartment',
          listingType: 'Rent',
          price: 1500,
          bedrooms: 1,
          bathrooms: 1,
          area: 800,
          status: 'published',
          owner: registerResponse.body.user._id
        }
      ];

      for (const prop of properties) {
        await request(app).post('/api/v1/properties').send(prop).set('Authorization', `Bearer ${token}`);
      }

      const response = await request(app).get('/api/v1/properties?keyword=penthouse&listingType=Rent');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Cozy Penthouse');
    });
  });

  describe('Admin Status Management', () => {
    test('Should publish and unpublish a property as admin', async () => {
      const adminData = {
        firstName: 'AdminStatus',
        lastName: 'Test',
        email: `admin.status.${Date.now()}@example.com`,
        password: 'AdminStatus123',
        role: 'admin'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(adminData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: adminData.email,
        password: adminData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Status Property',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1200,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        status: 'draft',
        owner: registerResponse.body.user._id
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      expect(createResponse.status).toBe(201);
      const propertyId = createResponse.body._id;

      const publishResponse = await request(app)
        .patch(`/api/v1/admin/properties/${propertyId}/status`)
        .send({ status: 'published' })
        .set('Authorization', `Bearer ${token}`);
      expect(publishResponse.status).toBe(200);
      expect(publishResponse.body.data.status).toBe('published');

      const dbProperty = await mongoose.model('Property').findById(propertyId);
      expect(dbProperty.status).toBe('published');
    });

    test('Should reject invalid property status', async () => {
      const adminData = {
        firstName: 'AdminInvalid',
        lastName: 'Test',
        email: `admin.invalid.${Date.now()}@example.com`,
        password: 'AdminInvalid123',
        role: 'admin'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(adminData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: adminData.email,
        password: adminData.password
      });
      const token = loginResponse.body.token;

      const propertyData = {
        title: 'Invalid Status Property',
        description: 'Description',
        propertyType: 'House',
        listingType: 'Rent',
        price: 1200,
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        owner: registerResponse.body.user._id
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${token}`);
      const propertyId = createResponse.body._id;

      const response = await request(app)
        .patch(`/api/v1/admin/properties/${propertyId}/status`)
        .send({ status: 'nonsense' })
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
    });

    test('Should activate and deactivate a user as admin', async () => {
      const adminData = {
        firstName: 'AdminUserStatus',
        lastName: 'Test',
        email: `admin.userstatus.${Date.now()}@example.com`,
        password: 'AdminUserStatus123',
        role: 'admin'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(adminData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: adminData.email,
        password: adminData.password
      });
      const token = loginResponse.body.token;

      const userData = {
        firstName: 'Target',
        lastName: 'User',
        email: `target.user.${Date.now()}@example.com`,
        password: 'TargetPassword123'
      };
      const userRegisterResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const targetUserId = userRegisterResponse.body.user._id;

      const deactivateResponse = await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}/status`)
        .send({ status: 'inactive' })
        .set('Authorization', `Bearer ${token}`);
      expect(deactivateResponse.status).toBe(200);
      expect(deactivateResponse.body.data.isActive).toBe(false);

      const dbUser = await mongoose.model('User').findById(targetUserId);
      expect(dbUser.isActive).toBe(false);
    });
  });

  describe('Image Upload', () => {
    test('Should upload an image and return a URL', async () => {

      const userData = {
        firstName: 'Uploader',
        lastName: 'Test',
        email: `uploader.${Date.now()}@example.com`,
        password: 'UploaderPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
      });
      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/v1/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('images', Buffer.from('fake-image-bytes'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.urls.length).toBe(1);
      expect(response.body.data.urls[0]).toMatch(/^\/uploads\//);

      // Clean up the uploaded fixture file so test runs don't litter the
      // public uploads directory.
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'public', response.body.data.urls[0].replace(/^\/uploads\//, ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    test('Should require authentication to upload', async () => {
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('images', Buffer.from('fake-image-bytes'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg'
        });
      expect(response.status).toBe(401);
    });
  });

  describe('Property Visibility', () => {
    test('Draft property is hidden from public listing and detail, visible to owner and admin', async () => {
      const ownerData = {
        firstName: 'VisOwner',
        lastName: 'Test',
        email: `vis.owner.${Date.now()}@example.com`,
        password: 'VisOwnerPassword123'
      };
      const adminData = {
        firstName: 'VisAdmin',
        lastName: 'Test',
        email: `vis.admin.${Date.now()}@example.com`,
        password: 'VisAdminPassword123',
        role: 'admin'
      };
      await request(app).post('/api/v1/auth/register').send(ownerData);
      const ownerLogin = await request(app).post('/api/v1/auth/login').send({
        email: ownerData.email,
        password: ownerData.password
      });
      const ownerToken = ownerLogin.body.token;
      const ownerId = ownerLogin.body.user._id;

      await request(app).post('/api/v1/auth/register').send(adminData);
      const adminLogin = await request(app).post('/api/v1/auth/login').send({
        email: adminData.email,
        password: adminData.password
      });
      const adminToken = adminLogin.body.token;

      // Create a draft property directly
      const propertyData = {
        title: 'Hidden Draft Home',
        description: 'A draft property that must stay invisible publicly',
        propertyType: 'House',
        listingType: 'Rent',
        price: 2000,
        bedrooms: 3,
        bathrooms: 2,
        area: 1400,
        status: 'draft',
        owner: ownerId
      };
      const createResponse = await request(app).post('/api/v1/properties').send(propertyData).set('Authorization', `Bearer ${ownerToken}`);
      expect(createResponse.status).toBe(201);
      const propertyId = createResponse.body._id;

      // Hidden from public listing
      const publicList = await request(app).get('/api/v1/properties');
      expect(publicList.status).toBe(200);
      expect(publicList.body.data.find(p => p._id.toString() === propertyId)).toBeUndefined();

      // Hidden from anonymous public detail
      const anonDetail = await request(app).get(`/api/v1/properties/${propertyId}`);
      expect(anonDetail.status).toBe(404);

      // Visible to the owner
      const ownerDetail = await request(app)
        .get(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(ownerDetail.status).toBe(200);
      expect(ownerDetail.body.title).toBe('Hidden Draft Home');

      // Visible to admin in the admin listing
      const adminList = await request(app)
        .get('/api/v1/admin/properties')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminList.status).toBe(200);
      expect(adminList.body.data.find(p => p._id.toString() === propertyId)).toBeTruthy();

      // Publish → visible publicly again
      const publishResponse = await request(app)
        .patch(`/api/v1/admin/properties/${propertyId}/status`)
        .send({ status: 'published' })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(publishResponse.status).toBe(200);

      const publicListAfter = await request(app).get('/api/v1/properties');
      expect(publicListAfter.body.data.find(p => p._id.toString() === propertyId)).toBeTruthy();

      const anonDetailAfter = await request(app).get(`/api/v1/properties/${propertyId}`);
      expect(anonDetailAfter.status).toBe(200);
    });

    test('Unknown property id returns 404, not 500', async () => {
      const missing = '000000000000000000000000';
      const response = await request(app).get(`/api/v1/properties/${missing}`);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('Should handle validation errors', async () => {
      const userData = {
        firstName: '',
        lastName: '',
        email: '',
        password: ''
      };
      const response = await request(app).post('/api/v1/auth/register').send(userData);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should handle 404 errors', async () => {
      const response = await request(app).get('/api/v1/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    test('Should handle malformed JSON/request', async () => {
      const response = await request(app).post('/api/v1/auth/register').send('invalid json');
      expect(response.status).toBe(400);
    });

    test('Should ensure password hashing never stores plaintext passwords', async () => {
      const userData = {
        firstName: 'HashTest',
        lastName: 'Test',
        email: `hashtest.${Date.now()}@example.com`,
        password: 'PlaintextPassword123'
      };
      const registerResponse = await request(app).post('/api/v1/auth/register').send(userData);
      expect(registerResponse.status).toBe(201);

      const dbUser = await mongoose.model('User').findOne({ email: userData.email });
      expect(dbUser).toBeTruthy();
      expect(dbUser.password).not.toBe(userData.password);
      expect(dbUser.password).not.toBe('PlaintextPassword123');
      expect(dbUser.password.length).toBeGreaterThan(10);
    });
  });
});