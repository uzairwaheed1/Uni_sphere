import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Department } from "./entities/department.entity";
import { Repository } from "typeorm";
import { University } from "../universities/university.entity";
import { NotFoundException } from "@nestjs/common";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,

    @InjectRepository(University)
    private universityRepo: Repository<University>,
  ) {}

  async create(dto: CreateDepartmentDto): Promise<Department> {
    const university = await this.universityRepo.findOneBy({ id: dto.universityId });

    if (!university) {
      throw new NotFoundException('University not found');
    }

    const department = this.departmentRepo.create({
      name: dto.name,
      university,
    });

    return this.departmentRepo.save(department);
  }

  findAll() {
    return this.departmentRepo.find({ relations: ['university'] });
  }

  findOne(id: string) {
    return this.departmentRepo.findOne({
      where: {id} 
      // relations: ['university'],
    });
  }

  update(id: string, dto: UpdateDepartmentDto) {
    return this.departmentRepo.update(id, dto);
  }

  remove(id: string) {
    return this.departmentRepo.delete(id);
  }
}
