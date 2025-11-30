# API Reference

## Endpoints

### GET /api/users

Retrieve all users.

**Response:**
```json
{
  "users": [
    { "id": 1, "name": "John Doe" }
  ]
}
```

### POST /api/users

Create a new user.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```
