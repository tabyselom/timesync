import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards,
 } from '@nestjs/common';
import { ApiOperation,ApiBearerAuth , ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './decorators/current-user/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import type { JwtPayload } from './../common/interfaces/jwt-payload.interface';

import { RefreshTokenDto } from './dto/refresh.dto';
import { Roles } from './decorators/roles/roles.decorator';

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto, @CurrentUser() user: JwtPayload) {
    return this.authService.refresh(user, dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkspaceRole.ADMIN)
  adminOnly() {
    
    return {
      
      message: 'Welcome Admin!',
    };
  }
}