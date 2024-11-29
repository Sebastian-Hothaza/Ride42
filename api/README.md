# Ride 42 API

This API provides core functionality to the Ride42 Trackday Management System.

## Features

* **MongoDB Integration** - Uses Mongoose package to access mongoDB *(connection URL must be provided as Environment Variable)*
* **Full CRUD support** - Supports CRUD for both the `Users` and `Trackday` Collection
* **Security** - Uses BCrypt for password hashing and JWT with httpOnly cookies to authenticate protected transactions. 
* **Controlled Convenience** - Uses JWT access and refresh tokens with database cross-checking for refresh tokens allowing users convenient signed in duration and control in the event of a security concern.

## Usage

*Note: Usage below indicates server actions on a successful request; server will respond with appropriate status code and JSON in format as outlined below (if appropriate). 
On a bad request, the server will respond with appropriate code and a JSON in the format of `{ msg : ['error_message', ...] }`. All transactions require credentials unless marked as PUBLIC*

*Note: Dates on back end are stored exclusively in UTC.*

### Specialized Requests

**Log in a user (PUBLIC):** Submit a `POST` request to `login/:userID`. Server will attach JWT httpOnly cookies (access & refresh tokens).

**Request password reset link (PUBLIC):** Submit a `POST` request to `/resetpassword`. 

**Reset password of an existing user in the `Users` collection:** Submit a `PUT` request to `/resetpassword/:userID/:token`. 

**Verify a user is checked in (PUBLIC):** Submit a `GET` request to `/verify/:userID/:trackdayID/:bikeID`. Server will respond with `{"verified" : "true"}` or `{"verified" : "false"}`.

**Add a user to a trackday:** Submit a `POST` request to `/register/:trackdayID/:userID`. 

**Remove a user from a trackday:** Submit a `DELETE` request to `/register/:trackdayID/:userID`.

**Reschedule a user:** Submit a `PUT` request to `/register/:userID/:trackdayID_OLD/:trackdayID_NEW`.

**Check in a user:** Submit a `POST` request to `/checkin/:userID/:trackdayID/:bikeID`.

**Add a motorcycle to a users garage:** Submit a `POST` request to `/garage/:userID/`. Server will respond with `id` of newly created bike.

**Remove a motorcycle from a users garage:** Submit a `DELETE` request to `/garage/:userID/:bikeID`.

**Generate QR codes:** Submit a `POST` request to `/QR`. Server will respond with array of newly created QR objects.

**Get all QR Code objects:** Submit a `GET` request to `/QR`. Server will respond with array of QR objects.

**Assign QR code to bike/user:** Submit a `PUT` request to `/QR/:QRID/:userID/:bikeID`. Server will respond with `id` of newly assigned QR.

**Delete QR Code:** Submit a `DELETE` request to `/QR/:QRID`.

**Get trackdays basic info (PUBLIC):** Submit a `GET` request to `/presentTrackdays`. Server will respond with JSON of all the trackdays.

**Get trackdays basic info for trackdays a user is registered for (PUBLIC):** Submit a `GET` request to `/presentTrackdays/:userID`. Server will respond with JSON of all the trackdays that a user is registered for.

**Update payment status of a user for a trackday:** Submit a `PUT` request to `/paid/:userID/:trackdayID`.

**Add walkon user to a trackday:** Submit a `POST` request to `'/walkons/:trackdayID'`.

**Mark user as having waiver completed:** Submit a `POST` request to `'/waiver/:userID'`.



### Create
**Create a new user in the `Users` collection (PUBLIC):** Submit a `POST` request to `/users`. Server will respond with `id` of newly created user.

**Create a new Trackday in the `Trackdays` collection:** Submit a `POST` request to `/trackdays`. Server will respond with `id` of newly created trackday.

### Read
**Get details of an existing user in the `Users` collection:** Submit a `GET` request to `/users/:userID`. Server will respond with JSON of the user.

**Get details of an existing trackday in the `Trackday` collection:** Submit a `GET` request to `/trackdays/:trackdayID`. Server will respond with JSON of the trackday.

**Get all users:** Submit a `GET` request to `/users`. Server will respond with JSON of all the users.

**Get all trackdays:** Submit a `GET` request to `/trackdays`. Server will respond with JSON of all the trackdays.

### Update
**Update an existing user in the `Users` collection:** Submit a `PUT` request to `/users/:userID`. Server will respond with `id` of newly updated user. Excludes password, waiver and garage.

**Change password of an existing user in the `Users` collection:** Submit a `PUT` request to `/password/:userID`. 

**Update an existing Trackday in the `Users` collection:** Submit a `PUT` request to `/trackdays/:trackdayID`. Server will respond with `id` of newly updated trackday.


### Delete
**Delete an existing user in the `Users` collection:** Submit a `DELETE` request to `/users/:userID`.

**Delete an existing Trackday in the `Users` collection:** Submit a `DELETE` request to `/trackdays/:trackdayID`.