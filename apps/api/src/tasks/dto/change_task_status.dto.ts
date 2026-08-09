import { TaskStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class ChangeTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
