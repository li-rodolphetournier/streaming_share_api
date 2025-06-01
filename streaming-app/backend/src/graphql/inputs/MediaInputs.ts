import { Field, Float, InputType, Int } from "type-graphql";
import { IsArray, IsOptional, Length, Max, Min } from "class-validator";
import { MediaType, VideoQuality } from "../types/Media";

@InputType()
export class MediaFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  search?: string;

  @Field(() => [MediaType], { nullable: true })
  @IsOptional()
  @IsArray()
  types?: MediaType[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  genres?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(10)
  minRating?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  minDuration?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  maxDuration?: number;

  @Field(() => [VideoQuality], { nullable: true })
  @IsOptional()
  @IsArray()
  qualities?: VideoQuality[];

  @Field({ nullable: true })
  @IsOptional()
  isPublic?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  isProcessed?: boolean;
}

@InputType()
export class MediaSortInput {
  @Field({ nullable: true })
  @IsOptional()
  field?: string;

  @Field({ nullable: true })
  @IsOptional()
  direction?: "ASC" | "DESC";
}

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}

@InputType()
export class CreateMediaInput {
  @Field()
  @Length(1, 255, {
    message: "Le titre doit contenir entre 1 et 255 caractères",
  })
  title!: string;

  @Field({ nullable: true })
  @IsOptional()
  @Length(0, 2000, {
    message: "La description ne peut pas dépasser 2000 caractères",
  })
  description?: string;

  @Field(() => MediaType)
  type!: MediaType;

  @Field()
  filePath!: string;

  @Field()
  fileName!: string;

  @Field(() => Float)
  @Min(0)
  fileSize!: number;

  @Field()
  fileHash!: string;

  @Field(() => Int)
  @Min(0)
  duration!: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  genres?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  cast?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  directors?: string[];

  @Field({ nullable: true })
  @IsOptional()
  releaseDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  imdbId?: string;

  @Field({ nullable: true })
  @IsOptional()
  tmdbId?: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  isPublic?: boolean;
}

@InputType()
export class UpdateMediaInput {
  @Field({ nullable: true })
  @IsOptional()
  @Length(1, 255, {
    message: "Le titre doit contenir entre 1 et 255 caractères",
  })
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Length(0, 2000, {
    message: "La description ne peut pas dépasser 2000 caractères",
  })
  description?: string;

  @Field(() => MediaType, { nullable: true })
  @IsOptional()
  type?: MediaType;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(10)
  rating?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  genres?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  cast?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  directors?: string[];

  @Field({ nullable: true })
  @IsOptional()
  releaseDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  imdbId?: string;

  @Field({ nullable: true })
  @IsOptional()
  tmdbId?: string;

  @Field({ nullable: true })
  @IsOptional()
  isPublic?: boolean;
}

@InputType()
export class WatchProgressInput {
  @Field(() => Int)
  mediaId!: number;

  @Field(() => Int)
  @Min(0)
  currentTime!: number;

  @Field({ nullable: true })
  @IsOptional()
  completed?: boolean;
}
