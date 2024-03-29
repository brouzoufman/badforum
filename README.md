# BadForum - CSS is Overrated

It's a forum. It does all the things a forum needs to do. It's raw HTML, with the
bare minimum of JavaScript in the login and registration pages, and the logo was
made in 30 seconds in Inkscape.

This thing was made to learn how some stuff in the Java ecosystem (Spring, Hibernate,
Thymeleaf, JPA) works. This may end up being a not-bad forum at some point, but the
most likely outcome is that, well... it won't. There's already plenty of forums out
there, after all, and they work just fine.


## Getting it running

- Run `gradle copydependencies`. This will take every dependency JAR the forum needs,
  and put it into the `dependencies/` folder.
- Run `gradle assemble`. This builds the JAR file, as usual.
- Run `./run.sh`. This will run the JAR file with the necessary classpath adjustment.

If everything works, you'll see some startup logs, finished off with a line looking
like `Server - Started @3394ms`.


## Setup

By default, the forum listens for HTTP connections on port 8081, and HTTPS connections
on port 4443 (if it's set up). To change this, create a file called `badforum.properties`
in the folder the JAR is in, and insert the following:

```text
badforum.port=<port>
badforum.ssl.port=<port>
```

If SSL support isn't set up, you'll see instructions for setting it up when starting
up the server. But for people already familiar with Jetty SSL support, the forum
looks for the keystore at `badforum_key.jks`, either in the directory the JAR file
is in or the directory you're running from (JAR directory preferred). To set the
password and key alias used, the following properties need to be set:

```text
badforum.ssl.password=<password>
badforum.ssl.alias=<alias>
```

When you start up the forum, there will be one board - the root board - and a test
thread. There will be no users, not even an administrator, but if you look in the
server's console output, you will see something that looks like this:

```text
-------------------------------------

You currently have no administrators.
   To fix this, create a new user
    with the following password:

  bB2@qjQ@z^tP&aL(BdSROaxMb@AWc9oO

-------------------------------------
```

The message should be self-explanatory. Once you do this, you'll have an account
with the "Global administrator" role. It is *heavily* recommended to change your
password after doing so, as while this password is random, it's still in the server
logs in plaintext.

You now have full admin access to the board. Most of the board-related stuff is
easy enough to find, but as of right now, there are two tools that aren't available
through any links.

- `/settings/<username>` - modify the settings and roles of the given user, or ban/unban them
- `/roles` - create, delete, and modify roles


## Roles and permissions

A role is composed of a name, a priority between -1000 and 1000 (with two exceptions),
and a collection of forum-level permissions. Each user has a list containing the roles
that it has, and each board has a list containing the roles that it holds board-level
permissions for.

A role's permissions can be set to either on, off, or pass-through. On and off are
self-explanatory, but a permission set to pass-through defers to a user's next highest
priority role to determine whether a given permission is on or off for a given user.
If this deference continues until there's no more roles to check, the permission
defaults to "off".

Board-level permissions are determined similarly. For every role a user has, its
permissiosns for the given board are checked, defaulting to pass-through if the
board doesn't specify any permissions for it. However, boards have a default on/off
value for every given board-level permission, which is used if permission checks
end up passing through to the very last role. This default value is also used for
anonymous (aka. not logged in) users, allowing one to (for example) create a board
where you can post without logging in.

For example, if a user has three roles, and permissions are set up as so:

  Role  | Manage users |  Ban users   | Manage roles | Manage boards | Manage detached entities
:------:|:------------:|:------------:|:------------:|:-------------:|:------------------------:
 aeiou  | on           | pass-through | pass-through | pass-through  | on
 xyzzy  | pass-through | off          | pass-through | on            | off
 plugh  | pass-through | on           | pass-through | pass-through  | off
 
The user would be allowed to manage users, manage boards, and managed detached entities,
but not be allowed to ban users or manage roles.

And if board permissions are set up as so:

  Role   | View board   | Post/reply   | Moderate board 
:-------:|:------------:|:------------:|:--------------:
 aeiou   | pass-through | pass-through | pass-through
 xyzzy   | pass-through | pass-through | pass-through
 plugh   | pass-through | on           | pass-through
 Default | on           | off          | off

The user would be allowed to view and post on the board, but not moderate it.


### Default roles

There are two roles that cannot be deleted. These roles are the "Global administrator"
role, and the "All users" role.

The "global administrator" role has a priority of Integer.MAX_INT, and is flagged
internally to have every permission at all times. This cannot be revoked. Without
messing with the forum database, there can be one global administrator at most.

The "all users" role has a priority of Integer.MIN_INT, and is flagged as the default
role. Every single user is added to this role, and cannot be removed from it without
database-level editing.

These roles are the two exceptions to the "-1000 to 1000 priority" rule mentioned above,
and their priorities cannot be changed.


### Priority

As mentioned above, each role has a priority from -1000 to 1000, with the two
exceptions mentioned above. These priorities are critical to establishing a heirarchy
of permissions - without this, any user with the "Manage users" or "Manage roles"
permissions would basically have full access to the forum, and any user with the
"Manage boards" permission would basically have full access to every board.

A user's priority is the highest priority out of all the roles they have. In general,
a user cannot modify whatever another user has created unless they outrank that user.
Specifically:

- A user can only delete/move/rename the posts/threads of users they outrank.
- A user can only modify the permissions of boards created by users they outrnak.
- A user can only modify the settings of users they outrank.
- A user can only ban users they outrank.
- A user can only revoke bans made by users they outrank.
- A user can only modify, grant, and revoke permissions with priority lower than their own.

This means that, for example, moderators cannot interfere with what other moderators
of the same rank can do, and nothing can overrule the global administrator. This also
has the side effect of there only being one global administrator, as you can't grant
roles with priority equal to your own.

This does mean that the "Manage roles" permission on "All users" only allows users
to see permissions, not modify them.

There is one exception to the outranking rule: if both users' highest ranked role
is the "All users" role, or if both users are anonymous, they count as outranking
each other. Enabling the relevant permissions on all users is guaranteed to be chaos,
but hey, it is what you asked for.


## Permission types

### Forum-level

- **Manage users:** A user with this permission can modify the settings of and assign
    roles to users that they outrank. A user with this permission can only assign roles
    with a priority lower than their highest priority.

- **Manage roles:** A user with this permission can modify the name, priority, and
    forum-level permissions of any role with a priority lower than their highest
    priority, or delete them if they so choose. They can also create roles. They
    cannot elevate any roles to or above their highest priority, or create roles
    of equal or higher priority than their highest.

- **Manage boards:** A user with this permission can create boards, delete boards,
    rename boards, and modify board-level permissions on boards. They can only do
    this on boards whose creators they outrank. The root board is considered created
    by no one, and so everyone with this permission can manage it.

- **Manage detached threads/posts:** In the case of a post or thread not attached
    to a board, this permission takes the place of the "moderate" board-level permission.

- **Ban users:** A user with this permission can ban users for any number of hours,
    or permanently. They can also undo bans on users. They can only ban users they
    outrank, and they can only revoke bans from users they outrank.


### Board-level

- **View:** A user with this permission can view the board, and the threads and
    posts on it.

- **Post:** A user with this permission can post new threads and reply to threads
    on the board.

- **Moderate:** A user with this permission can rename threads, delete threads and
    posts, move threads, and split post on the board. They must outrank the user
    whose thread/post they're interacting with, and they can only move threads
    or split posts to boards they moderate.


## Registration questions

If you try to register, you'll see a question appear at the bottom of the form.
These questions are loaded from the `triviaQuestions.txt` file by default, in either
the directory the JAR is in or the directory you're running from (JAR directory
preferred). If for some reason you want to change the filename the forum checks,
you can use the property `badforum.triviafilename` for that.

The `triviaQuestions.txt` file explains the file format, but just in case you lost it:

```text
# Format:
#  - First line: question
#  - Any amount of non-blank answers afterward: acceptable answers
#  - Blank lines: Question/answer delimiters
#
# Answers are case-insensitive, and have everything but letters, numbers, and whitespace stripped out
# Whitespace is further compressed into a single space, and leading/trailing whitespace is discarded
#
# Lines starting with # are ignored
```


## Flood protection

There is a flood protection system implemented. It's rather simple - make too many
requests in a given period of time, and the flood protection service kicks in
before any potentially costly database operations occur.

As of right now, the limits are:

- Page views (`view`): 10 per IP per second
- Login (`login`): 100 per IP per minute
- Registration (`register`): 100 per IP per hour
- Creating topics (`posttopic`): 2 per user (IP if anonymous) per minute
- Replying (`reply`): 4 per user (IP if anonymous) per minute

These settings can be modified. To do so, create a file named `badforum.properties`
in the folder the JAR is in if there isn't already one there, and use the following
lines as a reference point:

```text
badforum.flood.view.limit=10
badforum.flood.view.window=1
badforum.flood.login.limit=100
badforum.flood.login.window=60
badforum.flood.register.limit=100
badforum.flood.register.window=3600
badforum.flood.posttopic.limit=2
badforum.flood.posttopic.window=60
badforum.flood.reply.limit=4
badforum.flood.reply.window=60
```

The flood windows are in seconds.