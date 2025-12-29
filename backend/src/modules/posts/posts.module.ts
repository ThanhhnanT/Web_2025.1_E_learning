import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostsGateway } from './posts.gateway';
import { Post, PostSchema } from './schema/post.schema';
import { PostComment, PostCommentSchema } from './schema/comment.schema';
import { PostLike, PostLikeSchema } from './schema/post-like.schema';
import { PostReaction, PostReactionSchema } from './schema/post-reaction.schema';
import { CommentReaction, CommentReactionSchema } from './schema/comment-reaction.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: PostComment.name, schema: PostCommentSchema },
      { name: PostLike.name, schema: PostLikeSchema },
      { name: PostReaction.name, schema: PostReactionSchema },
      { name: CommentReaction.name, schema: CommentReactionSchema },
    ]),
    UsersModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsGateway],
  exports: [PostsService],
})
export class PostsModule {}

