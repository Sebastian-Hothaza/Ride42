# Ride 42 API

This API provides core functionality to the Ride42 Trackday Management System.

## Features

* **MongoDB Integration** - Uses Mongoose package to access mongoDB *(connection URL must be provided as Environment Variable)*
* **Full CRUD support** - Supports CRUD for both the `Users` and `Trackday` Collection
* **Security** - Uses BCrypt for password hashing and JWT with httpOnly cookies to authenticate protected transactions. 

## Usage

*Note: Usage below indicates server actions on a successful request; server will respond with appropriate status code and JSON in format as outlined below. 
On a bad request, the server will respond with appropriate code and a JSON in the format of `{"msg" : "error_message"}`. All transactions require credentials unless marked as PUBLIC*

### Specialized Requests

**Log in a user (PUBLIC):** Submit a `POST` request to `login/:userID`. Server will respond with `_id` of newly logged in user as well as attaching a JWT httpOnly cookie.

**Change password of an existing user in the `Users` collection:** Submit a `PUT` request to `/password/:userID`. Server will respond with `_id` of newly updated user.

**Get trackdays a user is registered for (PUBLIC):**  Submit a `GET` request to `/users/:userID/trackdays`. Server will respond with JSON `{"trackdays" : "[dates]"}`.

**Verify a user is checked in (PUBLIC):** Submit a `GET` request to `/verify/:userID`. Server will respond with `{"verified" : "true"}` or `{"verified" : "false"}` assuming user is registered for that trackday.

**Add a user to a trackday:** Submit a `POST` request to `/register/:trackdayID/:userID`. Server will respond with `_id` of newly registered user.

**Remove a user from a trackday:** Submit a `DELETE` request to `/register/:trackdayID/:userID`. Server will respond with `_id` of newly unregistered user.

**Reschedule a user:** Submit a `PUT` request to `/register/:trackdayID_OLD/:userID/:trackdayID_NEW`. Server will respond with `_id` of newly rescheduled user.

**Check in a user:** Submit a `PUT` request to `/checkin/:userID/:trackdayID`. Server will respond with `_id` of newly checked in user.

**Add a motorcycle to a users garage:** Submit a `POST` request to `/garage/:userID`. Server will respond with `_id` of newly added motorcycle.

**Remove a motorcycle from a users garage::** Submit a `DELETE` request to `/garage/:userID/:bikeID`. Server will respond with `_id` of newly removed motorcycle.


### Create
**Create a new user in the `Users` collection (PUBLIC):** Submit a `POST` request to `/users`. Server will respond with `_id` of newly created user as well as attaching a JWT httpOnly cookie.

**Create a new Trackday in the `Trackdays` collection:** Submit a `POST` request to `/trackdays`. Server will respond with `_id` of newly created trackday.

### Read
**Get details of an existing user in the `Users` collection:** Submit a `GET` request to `/users/:userID`. Server will respond with JSON of the user.

**Get details of an existing trackday in the `Trackday` collection:** Submit a `GET` request to `/trackdays/:trackdayID`. Server will respond with JSON of the trackday.

**Get all users:** Submit a `GET` request to `/users`. Server will respond with JSON of all the users.

**Get all trackdays:** Submit a `GET` request to `/trackdays`. Server will respond with JSON of all the trackdays.

### Update
**Update an existing user in the `Users` collection:** Submit a `PUT` request to `/users/:userID`. Server will respond with `_id` of newly updated user. Excludes password and garage.

**Update an existing Trackday in the `Users` collection:** Submit a `PUT` request to `/trackdays/:trackdayID`. Server will respond with `_id` of newly updated trackday.


### Delete
**Delete an existing user in the `Users` collection:** Submit a `DELETE` request to `/users/:userID`. Server will respond with `_id` of deleted user.

**Delete an existing Trackday in the `Users` collection:** Submit a `DELETE` request to `/trackdays/:trackdayID`. Server will respond with `_id` of deleted trackday.