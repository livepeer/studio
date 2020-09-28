# Livepeer.com API Reference

## Version: 0.0.1-alpha.0

### /stream

#### POST

##### Description

Receives Wowza stream

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

#### GET

##### Description

Lists streams

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### /object-store

#### POST

##### Description

Receives store credentials

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

#### GET

##### Description

Lists object store credentials by userId

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### /user-verification

#### POST

##### Description

Verifies user email

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### /password-reset-token

#### POST

##### Description

Creates a password reset token

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### /password-reset

#### POST

##### Description

Verifies password reset token

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### /make-admin

#### POST

##### Description

Changes user admin status

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### /user/token

#### POST

##### Description

Receives user login information

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### /user

#### POST

##### Description

Receives user information

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

#### PATCH

##### Description

updates a user

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

#### GET

##### Description

Lists users

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### /api-token

#### POST

##### Description

Contains api token information

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

#### GET

##### Description

Lists api tokens

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### /webhook

#### GET

##### Description

gets a list of webhooks defined by the user

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

#### POST

##### Description

creates a new webhook

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### /webhook/{id}

#### GET

##### Description

gets a specific webhook details

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

#### PUT

##### Description

updates a specific webhook

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

#### DELETE

##### Description

deletes a specific webhook details

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code    | Description |
| ------- | ----------- |
| 200     | Success     |
| default | Error       |

### Models

#### webhook

| Name      | Type    | Description                                                                                  | Required |
| --------- | ------- | -------------------------------------------------------------------------------------------- | -------- |
| id        | string  | _Example:_ `"de7818e7-610a-4057-8f6f-b785dc1e6f88"`                                          | No       |
| kind      | string  | _Example:_ `"webhook"`                                                                       | No       |
| name      | string  |                                                                                              | Yes      |
| userId    | string  |                                                                                              | No       |
| createdAt | number  | Timestamp (in milliseconds) at which stream object was created<br>_Example:_ `1587667174725` | No       |
| event     | string  | _Enum:_ `"streamStarted"`                                                                    | Yes      |
| url       | string  |                                                                                              | Yes      |
| deleted   | boolean |                                                                                              | No       |
| blocking  | boolean | If true, returning non 2xx value from webhook will prevent stream from starting              | No       |

#### stream

| Name                       | Type       | Description                                                                                                                                | Required |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| id                         | string     | _Example:_ `"de7818e7-610a-4057-8f6f-b785dc1e6f88"`                                                                                        | No       |
| kind                       | string     | _Example:_ `"stream"`                                                                                                                      | No       |
| name                       | string     | _Example:_ `"test_stream"`                                                                                                                 | Yes      |
| userId                     | string     | _Example:_ `"66E2161C-7670-4D05-B71D-DA2D6979556F"`                                                                                        | No       |
| lastSeen                   | number     | _Example:_ `1587667174725`                                                                                                                 | No       |
| sourceSegments             | number     | _Example:_ `1`                                                                                                                             | No       |
| transcodedSegments         | number     | _Example:_ `2`                                                                                                                             | No       |
| sourceSegmentsDuration     | number     | Duration of all the source segments, sec<br>_Example:_ `1`                                                                                 | No       |
| transcodedSegmentsDuration | number     | Duration of all the transcoded segments, sec<br>_Example:_ `2`                                                                             | No       |
| deleted                    | boolean    | Set to true when stream deleted                                                                                                            | No       |
| isActive                   | boolean    | If currently active                                                                                                                        | No       |
| createdByTokenName         | string     | Name of the token used to create this object                                                                                               | No       |
| createdAt                  | number     | Timestamp (in milliseconds) at which stream object was created<br>_Example:_ `1587667174725`                                               | No       |
| parentId                   | string     | Points to parent stream object<br>_Example:_ `"de7818e7-610a-4057-8f6f-b785dc1e6f88"`                                                      | No       |
| streamKey                  | string     | Used to form RTMP ingest URL<br>_Example:_ `"hgebdhhigq"`                                                                                  | No       |
| playbackId                 | string     | Used to form playback URL<br>_Example:_ `"eaw4nk06ts2d0mzb"`                                                                               | No       |
| profiles                   | [ object ] |                                                                                                                                            | No       |
| objectStoreId              | string     | _Example:_ `"D8321C3E-B29C-45EB-A1BB-A623D8BE0F65"`                                                                                        | No       |
| presets                    | [ string ] |                                                                                                                                            | No       |
| record                     | boolean    | Should this stream be recorded? Uses default settings. For more customization, create and configure an object store.<br>_Example:_ `false` | No       |
| recordObjectStoreId        | string     | ID of object store where to which this stream was recorded<br>_Example:_ `"D8321C3E-B29C-45EB-A1BB-A623D8BE0F65"`                          | No       |
| wowza                      | object     |                                                                                                                                            | No       |
| renditions                 | object     |                                                                                                                                            | No       |

#### error

| Name   | Type       | Description | Required |
| ------ | ---------- | ----------- | -------- |
| errors | [ string ] |             | Yes      |

#### object-store

| Name      | Type   | Description                                                                                             | Required |
| --------- | ------ | ------------------------------------------------------------------------------------------------------- | -------- |
| url       | string | Livepeer-compatible object store URL<br>_Example:_ `"s3://access-key:secret-key@us-west-2/bucket-name"` | Yes      |
| id        | string | _Example:_ `"09F8B46C-61A0-4254-9875-F71F4C605BC7"`                                                     | No       |
| userId    | string | _Example:_ `"66E2161C-7670-4D05-B71D-DA2D6979556F"`                                                     | No       |
| name      | string |                                                                                                         | No       |
| createdAt | number | Timestamp (in milliseconds) at which object store object was created<br>_Example:_ `1587667174725`      | No       |

#### api-token

| Name      | Type   | Description                                                                                 | Required |
| --------- | ------ | ------------------------------------------------------------------------------------------- | -------- |
| kind      | string | _Example:_ `"user"`                                                                         | No       |
| id        | string | _Example:_ `"09F8B46C-61A0-4254-9875-F71F4C605BC7"`                                         | No       |
| userId    | string | _Example:_ `"66E2161C-7670-4D05-B71D-DA2D6979556F"`                                         | No       |
| name      | string | _Example:_ `"Example Token"`                                                                | No       |
| lastSeen  | number | _Example:_ `1587667174725`                                                                  | No       |
| createdAt | number | Timestamp (in milliseconds) at which token object was created<br>_Example:_ `1587667174725` | No       |

#### user-verification

| Name            | Type   | Description                                              | Required |
| --------------- | ------ | -------------------------------------------------------- | -------- |
| email           | string | user email address<br>_Example:_ `"useremail@gmail.com"` | Yes      |
| emailValidToken | string | _Example:_ `"E1F53135E559C253"`                          | Yes      |

#### password-reset-token

| Name   | Type   | Description                                              | Required |
| ------ | ------ | -------------------------------------------------------- | -------- |
| email  | string | user email address<br>_Example:_ `"useremail@gmail.com"` | Yes      |
| userId | string | _Example:_ `"66E2161C-7670-4D05-B71D-DA2D6979556F"`      | No       |

#### make-admin

| Name  | Type    | Description                                              | Required |
| ----- | ------- | -------------------------------------------------------- | -------- |
| email | string  | user email address<br>_Example:_ `"useremail@gmail.com"` | Yes      |
| admin | boolean | _Example:_ `true`                                        | Yes      |

#### create-customer

| Name  | Type   | Description                                              | Required |
| ----- | ------ | -------------------------------------------------------- | -------- |
| email | string | user email address<br>_Example:_ `"useremail@gmail.com"` | Yes      |

#### create-subscription

| Name             | Type    | Description                                                             | Required |
| ---------------- | ------- | ----------------------------------------------------------------------- | -------- |
| stripeCustomerId | string  | stripe customer id<br>_Example:_ `"cus_xxxxxxxxxxxxxx"`                 | Yes      |
| paymentMethodId  | string  | stripe payment method id<br>_Example:_ `"src_xxxxxxxxxxxxxxxxxxxxxxxx"` | Yes      |
| productKey       | integer | the product key associated with the subscription plan<br>_Example:_ `0` | Yes      |

#### update-subscription

| Name             | Type    | Description                                                             | Required |
| ---------------- | ------- | ----------------------------------------------------------------------- | -------- |
| stripeCustomerId | string  | stripe customer id<br>_Example:_ `"cus_xxxxxxxxxxxxxx"`                 | Yes      |
| paymentMethodId  | string  | stripe payment method id<br>_Example:_ `"src_xxxxxxxxxxxxxxxxxxxxxxxx"` | Yes      |
| productKey       | integer | the product key associated with the subscription plan<br>_Example:_ `0` | Yes      |

#### retrieve-customer-payment-method

| Name            | Type   | Description                                                             | Required |
| --------------- | ------ | ----------------------------------------------------------------------- | -------- |
| paymentMethodId | string | stripe payment method id<br>_Example:_ `"src_xxxxxxxxxxxxxxxxxxxxxxxx"` | Yes      |

#### password-reset

| Name       | Type   | Description                                              | Required |
| ---------- | ------ | -------------------------------------------------------- | -------- |
| email      | string | user email address<br>_Example:_ `"useremail@gmail.com"` | Yes      |
| resetToken | string | _Example:_ `"E1F53135E559C253"`                          | Yes      |
| password   | string | _Example:_ `"thisisapassword"`                           | Yes      |
| userId     | string | _Example:_ `"66E2161C-7670-4D05-B71D-DA2D6979556F"`      | No       |

#### user

| Name                          | Type    | Description                                              | Required |
| ----------------------------- | ------- | -------------------------------------------------------- | -------- |
| email                         | string  | user email address<br>_Example:_ `"useremail@gmail.com"` | Yes      |
| password                      | string  | _Example:_ `"thisisapassword"`                           | Yes      |
| emailValidToken               | string  | _Example:_ `"E1F53135E559C253"`                          | No       |
| emailValid                    | boolean | _Example:_ `true`                                        | No       |
| salt                          | string  | _Example:_ `"E1F53135E559C253"`                          | No       |
| admin                         | boolean | _Example:_ `true`                                        | No       |
| kind                          | string  | _Example:_ `"user"`                                      | No       |
| id                            | string  | _Example:_ `"abc123"`                                    | No       |
| productKey                    | integer | _Example:_ `0`                                           | No       |
| stripeCustomerId              | string  | _Example:_ `"cus_Jv6KvgT0DCH8HU"`                        | No       |
| stripeCustomerPaymentMethodId | string  | _Example:_ `"pm_2FSSNNJfrKDAwlJ9n4EN15Du"`               | No       |
| ccLast4                       | string  | _Example:_ `1234`                                        | No       |
| ccBrand                       | string  | _Example:_ `1234`                                        | No       |
