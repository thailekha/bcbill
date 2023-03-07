const nano = require('nano')('http://admin:password@localhost:5984');

async function run() {
  try {
    const db = nano.db.use('mydatabase');

    // Insert user document
    const user = {
      _id: 'user:johndoe',
      name: 'John Doe',
      createdAt: Date.now()
    };
    await db.insert(user);

    // Insert post documents
    const post1 = {
      _id: 'post:1',
      title: 'My first post',
      content: 'This is my first blog post.',
      author: 'user:johndoe',
      createdAt: Date.now()
    };
    await db.insert(post1);

    const post2 = {
      _id: 'post:2',
      title: 'My second post',
      content: 'This is my second blog post.',
      author: 'user:johndoe',
      createdAt: Date.now()
    };
    await db.insert(post2);

    // Insert comment documents
    const comment1 = {
      _id: 'comment:1',
      text: 'Great post!',
      post: 'post:1',
      createdAt: Date.now()
    };
    await db.insert(comment1);

    const comment2 = {
      _id: 'comment:2',
      text: 'Thanks for sharing.',
      post: 'post:1',
      createdAt: Date.now()
    };
    await db.insert(comment2);

    const comment3 = {
      _id: 'comment:3',
      text: 'Interesting topic.',
      post: 'post:2',
      createdAt: Date.now()
    };
    await db.insert(comment3);

    console.log('Documents inserted successfully!');
  } catch (error) {
    console.error('Error inserting documents:', error);
  }
}


async function getCommentsByUserId(userId) {
  const db = nano.db.use('mydatabase');
  const postsSelector = {
    author: userId
  };
  const posts = await db.find({ selector: postsSelector });

  // Attach comments to posts
  const postsWithComments = [];
  for (const post of posts.docs) {
    const commentsSelector = {
      post: post._id,
      sort: [{ createdAt: 'asc' }]
    };
    const comments = await db.find({ selector: commentsSelector });
    postsWithComments.push({ ...post, comments: comments.docs });
  }

  return postsWithComments;
}

async function main() {
  await run();
  const commentsByUser = await getCommentsByUserId('user:johndoe');
  console.log(commentsByUser);
}

main();