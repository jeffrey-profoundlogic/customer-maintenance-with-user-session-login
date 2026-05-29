import { PoolType, getLibrary } from '../config/database.js';
import { Customer, CustomerCreate, CustomerUpdate, PaginatedResponse } from '../models/customer.js';

export class CustomerService {
  private get tableName(): string {
    return `${getLibrary()}.CUSTMAST`;
  }

  async findAll(pool: PoolType, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Customer>> {
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) AS TOTAL FROM ${this.tableName}`;
    const countResult = await pool.execute<{ TOTAL: number }>(countQuery);
    const total = countResult.data?.[0]?.TOTAL ?? 0;

    const dataQuery = `
      SELECT CUSTREF, NAME, SHORTNAME, ADDRESS1, ADDRESS2, ADDRESS3, ADDRESS4, POSTCODE, CREDLMT, PHONE, WEBSITE, CONTACT
      FROM ${this.tableName}
      ORDER BY CUSTREF
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;
    const dataResult = await pool.execute<Record<string, string>>(dataQuery);

    return {
      data: this.mapRows(dataResult.data || []),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async search(pool: PoolType, query: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Customer>> {
    const offset = (page - 1) * limit;
    const searchPattern = `%${query.toUpperCase()}%`;

    const countQuery = `
      SELECT COUNT(*) AS TOTAL FROM ${this.tableName}
      WHERE UPPER(CUSTREF) LIKE ? OR UPPER(NAME) LIKE ? OR UPPER(CONTACT) LIKE ?
    `;
    const countResult = await pool.execute<{ TOTAL: number }>(countQuery, {
      parameters: [searchPattern, searchPattern, searchPattern],
    });
    const total = countResult.data?.[0]?.TOTAL ?? 0;

    const dataQuery = `
      SELECT CUSTREF, NAME, SHORTNAME, ADDRESS1, ADDRESS2, ADDRESS3, ADDRESS4, POSTCODE, CREDLMT, PHONE, WEBSITE, CONTACT
      FROM ${this.tableName}
      WHERE UPPER(CUSTREF) LIKE ? OR UPPER(NAME) LIKE ? OR UPPER(CONTACT) LIKE ?
      ORDER BY CUSTREF
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;
    const dataResult = await pool.execute<Record<string, string>>(dataQuery, {
      parameters: [searchPattern, searchPattern, searchPattern],
    });

    return {
      data: this.mapRows(dataResult.data || []),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByRef(pool: PoolType, custref: string): Promise<Customer | null> {
    const query = `
      SELECT CUSTREF, NAME, SHORTNAME, ADDRESS1, ADDRESS2, ADDRESS3, ADDRESS4, POSTCODE, CREDLMT, PHONE, WEBSITE, CONTACT
      FROM ${this.tableName}
      WHERE CUSTREF = ?
    `;
    const result = await pool.execute<Record<string, string>>(query, {
      parameters: [custref],
    });

    return this.mapRows(result.data || [])[0] || null;
  }

  async create(pool: PoolType, data: CustomerCreate): Promise<Customer> {
    const query = `
      INSERT INTO ${this.tableName}
      (CUSTREF, NAME, SHORTNAME, ADDRESS1, ADDRESS2, ADDRESS3, ADDRESS4, POSTCODE, CREDLMT, PHONE, WEBSITE, CONTACT)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(query, {
      parameters: [
        data.custref,
        data.name,
        data.shortname,
        data.address1,
        data.address2,
        data.address3,
        data.address4,
        data.postcode,
        data.credlmt,
        data.phone,
        data.website,
        data.contact,
      ],
    });

    const created = await this.findByRef(pool, data.custref);
    if (!created) throw new Error('Failed to retrieve created customer');
    return created;
  }

  async update(pool: PoolType, custref: string, data: CustomerUpdate): Promise<Customer | null> {
    const existing = await this.findByRef(pool, custref);
    if (!existing) return null;

    const query = `
      UPDATE ${this.tableName}
      SET NAME = ?, SHORTNAME = ?, ADDRESS1 = ?, ADDRESS2 = ?, ADDRESS3 = ?, ADDRESS4 = ?,
          POSTCODE = ?, CREDLMT = ?, PHONE = ?, WEBSITE = ?, CONTACT = ?
      WHERE CUSTREF = ?
    `;
    await pool.execute(query, {
      parameters: [
        data.name,
        data.shortname,
        data.address1,
        data.address2,
        data.address3,
        data.address4,
        data.postcode,
        data.credlmt,
        data.phone,
        data.website,
        data.contact,
        custref,
      ],
    });

    return this.findByRef(pool, custref);
  }

  async delete(pool: PoolType, custref: string): Promise<boolean> {
    const existing = await this.findByRef(pool, custref);
    if (!existing) return false;

    await pool.execute(`DELETE FROM ${this.tableName} WHERE CUSTREF = ?`, {
      parameters: [custref],
    });

    return true;
  }

  private mapRows(rows: Record<string, unknown>[]): Customer[] {
    return rows.map((row) => ({
      custref: String(row.CUSTREF || '').trim(),
      name: String(row.NAME || '').trim(),
      shortname: String(row.SHORTNAME || '').trim(),
      address1: String(row.ADDRESS1 || '').trim(),
      address2: String(row.ADDRESS2 || '').trim(),
      address3: String(row.ADDRESS3 || '').trim(),
      address4: String(row.ADDRESS4 || '').trim(),
      postcode: String(row.POSTCODE || '').trim(),
      credlmt: Number(row.CREDLMT) || 0,
      phone: String(row.PHONE || '').trim(),
      website: String(row.WEBSITE || '').trim(),
      contact: String(row.CONTACT || '').trim(),
    }));
  }
}

export const customerService = new CustomerService();
