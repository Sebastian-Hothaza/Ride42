# Ride 42 API

This API provides core functionality to the Ride42 Trackday Management System.

## Features

* **MongoDB Integration** - Uses Mongoose package to access mongoDB *(connection URL must be provided as Environment Variable)*
* **Full CRUD support** - Supports CRUD for both the `Users` and `Trackday` Collection
* **Security** - Uses BCrypt for password hashing and JWT with httpOnly cookies to authenticate protected transactions. 

## Usage

*Note: Usage below indications server actions on a successful request. On a successful request, the server will respond with appropriate status code and JSON in format as outlined below. 
On a bad request, the server will respond with appropriate code and a JSON in the format of `{"msg" : "error_message"}`. All transactions require credentials unless marked as PUBLIC*

### Create
**Create a new user in the `Users` collection (PUBLIC):** Submit a `POST` request to `/users`. Server will respond with `_id` of newly created user as well as attaching a JWT httpOnly cookie.

**Create a new Trackday in the `Trackdays` collection:** Submit a `POST` request to `/trackdays`. Server will respond with `_id` of newly created trackday.

### Read
**Get details of an existing user in the `Users` collection:** Submit a `GET` request to `/users/:userID`. Server will respond with JSON of the user.

**Get details of an existing trackday in the `Trackday` collection:** Submit a `GET` request to `/trackdays/:trackdayID`. Server will respond with JSON of the trackday.

**Log in a user:** Submit a `GET` request to `login/:userID`. Server will respond with `_id` of newly logged in user as well as attaching a JWT httpOnly cookie.

**Verify a user is checked in (PUBLIC):** Submit a `GET` request to `/verify/:userID`. Server will respond with `{"verified" : "true"}` or `{"verified" : "false"}` assuming user is registered for that trackday.

### Update
**Update an existing user in the `Users` collection:** Submit a `PUT` request to `/users/:userID`. Server will respond with `_id` of newly updated user.

**Update an existing Trackday in the `Users` collection:** Submit a `PUT` request to `/trackdays/:trackdayID`. Server will respond with `_id` of newly updated trackday.

**Check in a user:** Submit a `PUT` request to `/trackdays/:trackdayID/checkin/:userID`. Server will respond with `_id` of newly checked in user.

### Delete
**Delete an existing user in the `Users` collection:** Submit a `DELETE` request to `/users/:userID`. Server will respond with `_id` of deleted user.

**Delete an existing Trackday in the `Users` collection:** Submit a `DELETE` request to `/trackdays/:trackdayID`. Server will respond with `_id` of deleted trackday.