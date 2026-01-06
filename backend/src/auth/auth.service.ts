
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { comparePass } from '@/utils/hashpass';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { VerifyDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService : JwtService
  
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await comparePass(pass, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid password');

    return user;
  }

  async validateAdminUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await comparePass(pass, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid password');

    // Only administrator role for admin login
    if (user.role !== 'administrator') {
      throw new UnauthorizedException('Access denied. Administrator role required.');
    }

    return user;
  }

  async getUser(email: string): Promise <any> {
    const user = await this.usersService.getUserByEmail(email);
      if (!user) throw new UnauthorizedException('User not found');
    return user
  }

  async signIn(id: string, email: string): Promise<object> {
    console.log(id, email)
    const payload = {sud: id, email: email} 
    const access_token = await this.jwtService.signAsync(payload)
    return {
      statusCode: 200,
      access_token: access_token,
      id: id,
      email: email
    };
  }

  register = async ( createUser : CreateAuthDto) => {
    const res = await this.usersService.hanldeRegister(createUser)
    if (res.statusCode !== 201){
      return res
    }
    // Auto login after registration (email_verified = true by default)
    const {id, email} = res
    const payload = {sud: id, email: email} 
    const access_token = await this.jwtService.signAsync(payload)
    return {
      statusCode: 201,
      access_token: access_token,
      id: id,
      email: email
    };
  }

  verifyEmail = async (verify_email : VerifyDto) => {
    const res = await this.usersService.verifyEmail(verify_email)
    if (res.statusCode !== 200){
      return res
    }
    const {id, email} = res
    console.log(id, email)
    const payload = {sud: id, email: email} 
    const access_token = await this.jwtService.signAsync(payload)
    return {
      statusCode: 200,
      access_token: access_token,
      id: id,
      email: email
    };
  }

  async recordLogin(userId: string, ip?: string, location?: string) {
    await this.usersService.recordLogin(userId, ip, location);
  }

  async getLocationFromIp(ip: string): Promise<string | undefined> {
    try {
      // Handle localhost - can't get real location, return descriptive message
      if (!ip || ip === '::1' || ip === '127.0.0.1') {
        return 'Localhost';
      }
      
      // For private IPs, we can't get real location from public API
      if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        return 'Private Network';
      }

      // Create AbortController for timeout (compatible with older Node.js)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      let response;
      try {
        response = await fetch(`https://ipinfo.io/${ip}/json`, {
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn(`ipinfo.io API timeout for IP ${ip}`);
        }
        return undefined;
      }

      if (!response.ok) {
        console.warn(`ipinfo.io API returned status ${response.status} for IP ${ip}`);
        return undefined;
      }

      const data = await response.json();
      
      // Format: "City, Region, Country"
      const parts: string[] = [];
      if (data.city) parts.push(String(data.city));
      if (data.region) parts.push(String(data.region));
      if (data.country) parts.push(String(data.country));
      
      return parts.length > 0 ? parts.join(', ') : undefined;
    } catch (error: any) {
      // Log error but don't throw - location is optional
      console.warn(`Failed to get location from ipinfo.io for IP ${ip}:`, error.message);
      return undefined;
    }
  }
}
