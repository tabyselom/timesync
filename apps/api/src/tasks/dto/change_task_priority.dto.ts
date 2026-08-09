import { TaskPriority } from "@prisma/client";
import { IsEnum } from "class-validator";

export class ChangeTaskPriorityDto {
  @IsEnum(TaskPriority)
  priority:TaskPriority;
}