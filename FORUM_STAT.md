### Description
Added 3 new endpoints
* GET /api/v3/users/:uid/posts
* GET /api/v3/users/:uid/comments
* GET /api/v3/users/:uid/activity/count

The `uid` is a `memberUid`.
Use the `after` parameter for pagination.
Should be used similarly to the existing calls from [UI to Forum APIs](https://github.com/memser-spaceport/pln-directory-portal-v2/blob/main/services/forum/hooks/useForumPosts.ts#L91-L101)

### Get Forum activity for a user:
Request:
```
curl --location 'http://localhost:4567/api/v3/users/cmhwh5q99003hf504sg19nr83/activity/count' \
--header 'Authorization: Bearer {token}
```
Response:
```
{
    "status": {
        "code": "ok",
        "message": "OK"
    },
    "response": {
        "postsCount": 4,
        "commentsCount": 28
    }
}
```

### Get posts:
Example for a John

![posts.png](posts.png)

Request:
```
curl --location 'http://localhost:4567/api/v3/users/cmhwh5q99003hf504sg19nr83/posts?after=0' \
--header 'Authorization: Bearer {token}
```
Response:
```
{
    "status": {
        "code": "ok",
        "message": "OK"
    },
    "response": {
        "posts": [
            {
                "cid": 2,
                "lastposttime": 1768241297555,
                "mainPid": 179,
                "postcount": 12,
                "slug": "30/web3-discassion",
                "tid": 30,
                "timestamp": 1768231652064,
                "title": "Web3 Discassion",
                "uid": 6,
                "viewcount": 6,
                "postercount": 3,
                "followercount": 1,
                "downvotes": 0,
                "upvotes": 2,
                "teaserPid": "190",
                "deleted": 0,
                "locked": 0,
                "pinned": 0,
                "pinExpiry": 0,
                "deleterUid": 0,
                "titleRaw": "Web3 Discassion",
                "timestampISO": "2026-01-12T15:27:32.064Z",
                "scheduled": false,
                "lastposttimeISO": "2026-01-12T18:08:17.555Z",
                "pinExpiryISO": "",
                "votes": 2,
                "tags": [],
                "thumbs": [],
                "category": {
                    "cid": 2,
                    "name": "General Discussion",
                    "slug": "2/general-discussion",
                    "icon": "fa-comments-o",
                    "backgroundImage": "",
                    "imageClass": "cover",
                    "bgColor": "#59b3d0",
                    "color": "#ffffff",
                    "disabled": 0
                },
                "user": {
                    "uid": 6,
                    "username": "john-doe",
                    "userslug": "john-doe",
                    "reputation": 6,
                    "postcount": 10,
                    "picture": "https://pl-directory-images-dev.s3.us-west-1.amazonaws.com/d5e7dce313f522b2.png",
                    "signature": null,
                    "banned": false,
                    "status": "online",
                    "lastonline": 1768923111966,
                    "groupTitle": "[\"administrators\"]",
                    "mutedUntil": 0,
                    "externalId": "cmjj63grz00481u3bjp1v0x3d",
                    "accessLevel": "L2",
                    "teamRole": "Dev",
                    "teamName": "Web3 Team",
                    "memberUid": "cmhwh5q99003hf504sg19nr83",
                    "officeHours": null,
                    "ohStatus": "NOT_FOUND",
                    "displayname": "john-doe",
                    "groupTitleArray": [
                        "administrators"
                    ],
                    "icon:bgColor": "#3f51b5",
                    "icon:text": "J",
                    "lastonlineISO": "2026-01-20T15:31:51.966Z",
                    "muted": false,
                    "banned_until_readable": "Not Banned",
                    "isLocal": true
                },
                "isOwner": true,
                "ignored": false,
                "followed": true,
                "unread": false,
                "bookmark": null,
                "unreplied": false,
                "icons": [],
                "index": 0,
                "content": "<p>Hi everyone!!!</p>"
            }
        ],
        "nextStart": null
    }
}
```
* Comments:`postcount` = 12 - 1 (because 1 is a post comment)
* Views: `viewcount` = 6
* Likes: `upvotes - downvotes` = 2 (we can omit downvotes because we don't have such an element in UI)

### Get comments:
Example for a John

![comments.png](comments.png)

Link to the comment: http://localhost:4200/forum/topics/1/20?pid=195

Request:
```
curl --location 'http://localhost:4567/api/v3/users/cmhwh5q99003hf504sg19nr83/comments?after=0' \
--header 'Authorization: Bearer {token}
```
Response:
```
{
    "status": {
        "code": "ok",
        "message": "OK"
    },
    "response": {
        "comments": [
            {
                "pid": 195,
                "tid": 20,
                "toPid": 193,
                "content": "<p dir=\"auto\">&lt;p&gt;Hi Jane, how are you?&lt;/p&gt;</p>\n",
                "sourceContent": null,
                "uid": 6,
                "timestamp": 1768851060699,
                "deleted": false,
                "upvotes": 1,
                "downvotes": 0,
                "replies": 0,
                "votes": 1,
                "timestampISO": "2026-01-19T19:31:00.699Z",
                "user": {
                    "uid": 6,
                    "username": "john-doe",
                    "userslug": "john-doe",
                    "picture": "https://pl-directory-images-dev.s3.us-west-1.amazonaws.com/d5e7dce313f522b2.png",
                    "status": "online",
                    "displayname": "john-doe",
                    "icon:bgColor": "#3f51b5",
                    "icon:text": "J",
                    "isLocal": true
                },
                "topic": {
                    "uid": 1,
                    "tid": 20,
                    "title": "Test post #9",
                    "cid": 1,
                    "tags": [],
                    "slug": "20/test-post-9",
                    "deleted": 0,
                    "scheduled": false,
                    "postcount": 3,
                    "mainPid": 90,
                    "teaserPid": "195",
                    "timestamp": 1767136997924,
                    "titleRaw": "Test post #9",
                    "timestampISO": "2025-12-30T23:23:17.924Z"
                },
                "category": {
                    "cid": 1,
                    "name": "Announcements",
                    "icon": "fa-bullhorn",
                    "slug": "1/announcements",
                    "parentCid": 0,
                    "bgColor": "#fda34b",
                    "color": "#ffffff",
                    "backgroundImage": "",
                    "imageClass": "cover"
                },
                "isMainPost": false,
                "slug": "20/test-post-9"
            }
        ],
        "nextStart": null
    }
}
```
