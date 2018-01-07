import 'jest'
import * as Sinon from 'sinon'
import { EloquentTestBase } from '../eloquent/EloquentTestBase'
import { IMongooseProvider } from '../../lib/interfaces/IMongooseProvider'
import { MongooseQueryBuilder } from '../../lib/query-builders/MongooseQueryBuilder'
import { make, register } from 'najs'
import { model, Schema, Mongoose } from 'mongoose'

const mongoose = require('mongoose')

@register()
class MongooseProvider implements IMongooseProvider {
  static className: string = 'MongooseProvider'

  getClassName() {
    return MongooseProvider.className
  }

  getMongooseInstance() {
    return mongoose
  }
}

const UserSchema: Schema = new Schema(
  {
    first_name: { type: String },
    last_name: { type: String },
    age: { type: Number }
  },
  {
    collection: 'users'
  }
)
const UserModel = model('User', UserSchema)

interface IUser {
  first_name: string
  last_name: string
  password: string
}

class User extends EloquentTestBase<IUser> {
  getClassName() {
    return 'User'
  }
}
register(User)

// ---------------------------------------------------------------------------------------------------------------------

describe('MongooseQueryBuilder', function() {
  describe('pre-configuration', function() {
    it('must register MongooseProvider before using MongooseQueryBuilder', function() {
      expect(make<IMongooseProvider>(MongooseProvider.className).getMongooseInstance()).toBeInstanceOf(Mongoose)
    })
  })

  describe('constructor()', function() {
    it('is created by modelName', function() {
      const query = new MongooseQueryBuilder('User')
      expect(query['mongooseModel'].modelName).toEqual('User')
    })

    it('throws exception if model not found', function() {
      try {
        new MongooseQueryBuilder('NotFound')
      } catch (error) {
        expect(error.message).toEqual('Model NotFound Not Found')
        return
      }
      expect('it').toEqual('should throw exception')
    })
  })

  describe('protected getMongoose()', function() {
    it('uses make("MongooseProvider") to get an instance of mongoose', function() {
      const query = new MongooseQueryBuilder('User')
      expect(query['getMongoose']() === mongoose).toBe(true)
    })
  })

  describe('protected getQuery()', function() {
    it('just build getQuery once', function() {
      const query = new MongooseQueryBuilder('User')
      query.limit(10)
      expect(query['hasMongooseQuery']).toBeUndefined()
      query['getQuery']()
      expect(query['hasMongooseQuery']).toBe(true)
      expect(query['getQuery']() === query['mongooseQuery']).toBe(true)
      expect(query['hasMongooseQuery']).toBe(true)
    })

    it('builds query for find by default', function() {
      const query = new MongooseQueryBuilder('User')
      expect(query['getQuery']()['op']).toEqual('find')
    })

    it('can build query for findOne', function() {
      const query = new MongooseQueryBuilder('User')
      expect(query['getQuery'](true)['op']).toEqual('findOne')
    })
  })

  describe('protected passDataToMongooseQuery()', function() {
    it('never passes to mongooseQuery.select if .select() was not used', function() {
      const nativeQuery = UserModel.find()
      const selectSpy = Sinon.spy(nativeQuery, 'select')
      const query = new MongooseQueryBuilder('User')
      query['passDataToMongooseQuery'](nativeQuery)
      expect(selectSpy.notCalled).toBe(true)
    })
    it('passes to mongooseQuery.select with selectedFields.join(" ") if .select() was used', function() {
      const nativeQuery = UserModel.find()
      const selectSpy = Sinon.spy(nativeQuery, 'select')
      const query = new MongooseQueryBuilder('User')
      query.select('first_name', 'last_name')
      query['passDataToMongooseQuery'](nativeQuery)
      expect(selectSpy.calledWith('first_name last_name')).toBe(true)
    })

    it('never passes to mongooseQuery.distinct if .distinct() was not used', function() {
      const nativeQuery = UserModel.find()
      const distinctSpy = Sinon.spy(nativeQuery, 'distinct')
      const query = new MongooseQueryBuilder('User')
      query['passDataToMongooseQuery'](nativeQuery)
      expect(distinctSpy.notCalled).toBe(true)
    })
    it('passes to mongooseQuery.distinct with distinctFields.join(" ") if .distinct() was used', function() {
      const nativeQuery = UserModel.find()
      const distinctSpy = Sinon.spy(nativeQuery, 'distinct')
      const query = new MongooseQueryBuilder('User')
      query.distinct('first_name', 'last_name')
      query['passDataToMongooseQuery'](nativeQuery)
      expect(distinctSpy.calledWith('first_name last_name')).toBe(true)
    })

    it('never passes to mongooseQuery.limit if .limit() was not used', function() {
      const nativeQuery = UserModel.find()
      const limitSpy = Sinon.spy(nativeQuery, 'limit')
      const query = new MongooseQueryBuilder('User')
      query['passDataToMongooseQuery'](nativeQuery)
      expect(limitSpy.notCalled).toBe(true)
    })
    it('passes to mongooseQuery.limit with limitNumber if .limit() was used', function() {
      const nativeQuery = UserModel.find()
      const limitSpy = Sinon.spy(nativeQuery, 'limit')
      const query = new MongooseQueryBuilder('User')
      query.limit(20)
      query['passDataToMongooseQuery'](nativeQuery)
      expect(limitSpy.calledWith(20)).toBe(true)
    })

    it('never passes to mongooseQuery.sort if .orderBy() .orderByAsc() .orderByDesc were not used', function() {
      const nativeQuery = UserModel.find()
      const sortSpy = Sinon.spy(nativeQuery, 'sort')
      const query = new MongooseQueryBuilder('User')
      query['passDataToMongooseQuery'](nativeQuery)
      expect(sortSpy.notCalled).toBe(true)
    })
    it('passes to mongooseQuery.sort with transformed ordering if .orderBy() was used', function() {
      const nativeQuery = UserModel.find()
      const sortSpy = Sinon.spy(nativeQuery, 'sort')
      const query = new MongooseQueryBuilder('User')
      query.orderBy('first_name')
      query['passDataToMongooseQuery'](nativeQuery)
      expect(sortSpy.calledWith({ first_name: 1 })).toBe(true)
    })
    it('passes to mongooseQuery.sort with transformed ordering if .orderByAsc() was used', function() {
      const nativeQuery = UserModel.find()
      const sortSpy = Sinon.spy(nativeQuery, 'sort')
      const query = new MongooseQueryBuilder('User')
      query.orderByAsc('first_name.child')
      query['passDataToMongooseQuery'](nativeQuery)
      expect(sortSpy.calledWith({ 'first_name.child': 1 })).toBe(true)
    })
    it('passes to mongooseQuery.sort with transformed ordering if .orderByDesc() was used', function() {
      const nativeQuery = UserModel.find()
      const sortSpy = Sinon.spy(nativeQuery, 'sort')
      const query = new MongooseQueryBuilder('User')
      query.orderByDesc('first_name.child')
      query['passDataToMongooseQuery'](nativeQuery)
      expect(sortSpy.calledWith({ 'first_name.child': -1 })).toBe(true)
    })
  })

  describe('native()', function() {
    it('is chain-able', function() {
      const query = new MongooseQueryBuilder('User')
      expect(
        query.native(function(model) {
          return model.find()
        })
      ).toEqual(query)
    })

    it('passes instance of Mongoose Model if there is no query builder function was used', function() {
      const query = new MongooseQueryBuilder('User')
      query.native(function(model) {
        expect(model === query['mongooseModel']).toBe(true)
        return model.find()
      })
    })

    it('passes getQuery(false) result if there is a query builder functions was used', function() {
      const query = new MongooseQueryBuilder('User')
      query.limit(10)
      query.native(function(nativeQuery: any) {
        expect(nativeQuery === query['mongooseQuery']).toBe(true)
        return nativeQuery
      })
    })
  })

  describe('toObject()', function() {
    it('returns signature object of the query, conditions is translated to mongodb query', function() {
      const query = new MongooseQueryBuilder('User')
      query
        .select('first_name')
        .distinct('last_name')
        .limit(10)
        .orderBy('first_name')
        .where('first_name', 'tony')
        .where('last_name', 'any')
        .orWhere('age', 10)
      expect(query.toObject()).toEqual({
        select: ['first_name'],
        distinct: ['last_name'],
        limit: 10,
        orderBy: { first_name: 'asc' },
        conditions: {
          first_name: 'tony',
          $or: [{ last_name: 'any' }, { age: 10 }]
        }
      })
    })

    it('skips select, distinct, limit if was not called', function() {
      const query = new MongooseQueryBuilder('User')
      query.orderBy('first_name').where('first_name', 'tony')
      expect(query.toObject()).toEqual({
        orderBy: { first_name: 'asc' },
        conditions: {
          first_name: 'tony'
        }
      })
    })

    it('skips orderBy if was not called', function() {
      const query = new MongooseQueryBuilder('User')
      query.where('first_name', 'tony')
      expect(query.toObject()).toEqual({
        conditions: {
          first_name: 'tony'
        }
      })
    })

    it('skips conditions if empty', function() {
      const query = new MongooseQueryBuilder('User')
      query.orderBy('first_name', 'asc')
      expect(query.toObject()).toEqual({
        orderBy: { first_name: 'asc' }
      })
    })
  })

  describe('Fetch Result Functions', function() {
    jest.setTimeout(10000)

    const dataset = [
      { first_name: 'john', last_name: 'doe', age: 30 },
      { first_name: 'jane', last_name: 'doe', age: 25 },
      { first_name: 'tony', last_name: 'stark', age: 40 },
      { first_name: 'thor', last_name: 'god', age: 1000 },
      { first_name: 'captain', last_name: 'american', age: 100 },
      { first_name: 'tony', last_name: 'stewart', age: 40 },
      { first_name: 'peter', last_name: 'parker', age: 15 }
    ]

    beforeAll(async function() {
      return new Promise(resolve => {
        mongoose.connect('mongodb://localhost/najs_eloquent_test')
        mongoose.Promise = global.Promise
        mongoose.connection.once('open', () => {
          resolve(true)
        })
      }).then(async function() {
        for (const data of dataset) {
          const user = new UserModel()
          user.set(data)
          await user.save()
        }
      })
    })

    afterAll(async function() {
      return new Promise(resolve => {
        try {
          if (mongoose.connection.collection('users')) {
            mongoose.connection.collection('users').drop(function() {
              resolve(true)
            })
          } else {
            resolve(true)
          }
        } catch (error) {}
      })
    })

    function expect_match_user(result: any, expected: any) {
      expect(result).toBeInstanceOf(User)
      for (const name in expected) {
        expect(result[name]).toEqual(expected[name])
      }
    }

    describe('get()', function() {
      it('gets all data of collection and return an instance of Collection<Eloquent<T>>', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query.get()
        expect(result.count()).toEqual(7)
        const resultArray = result.all()
        for (let i = 0; i < 7; i++) {
          expect_match_user(resultArray[i], dataset[i])
        }
      })

      it('returns an empty collection if no result', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query.where('first_name', 'no-one').get()
        expect(result.isEmpty()).toBe(true)
      })

      it('can get data by query builder, case 1', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query.where('age', 1000).get()
        expect(result.count()).toEqual(1)
        expect_match_user(result.first(), dataset[3])
      })

      it('can get data by query builder, case 2', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query.where('age', 40).get()
        expect(result.count()).toEqual(2)
        expect_match_user(result.items[0], dataset[2])
        expect_match_user(result.items[1], dataset[5])
      })

      it('can get data by query builder, case 3', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query
          .where('age', 40)
          .where('last_name', 'stark')
          .get()
        expect(result.count()).toEqual(1)
        expect_match_user(result.items[0], dataset[2])
      })

      it('can get data by query builder, case 4', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query
          .where('age', 40)
          .orWhere('first_name', 'peter')
          .get()
        expect(result.count()).toEqual(3)
        expect_match_user(result.items[0], dataset[2])
        expect_match_user(result.items[1], dataset[5])
        expect_match_user(result.items[2], dataset[6])
      })
    })

    describe('find()', function() {
      it('finds first document of collection and return an instance of Eloquent<T>', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query.find()
        expect_match_user(result, dataset[0])
      })

      it('returns null if no result', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query.where('first_name', 'no-one').find()
        expect(result).toBeNull()
      })

      it('can find data by query builder, case 1', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query.where('age', 1000).find()
        expect_match_user(result, dataset[3])
      })

      it('can find data by query builder, case 2', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query
          .where('age', 40)
          .orWhere('first_name', 'jane')
          .find()
        expect_match_user(result, dataset[1])
      })

      it('can find data by query builder, case 3', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query
          .where('first_name', 'tony')
          .where('last_name', 'stewart')
          .find()
        expect_match_user(result, dataset[5])
      })

      it('can find data by native() before using query functions of query builder', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query
          .native(function(model: any) {
            return model.findOne({
              first_name: 'tony'
            })
          })
          .find()
        expect_match_user(result, dataset[2])
      })

      it('can find data by native() after using query functions of query builder', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query
          .where('age', 40)
          .orWhere('age', 1000)
          .native(function(nativeQuery: any) {
            return nativeQuery.sort({ last_name: -1 })
          })
          .find()
        expect_match_user(result, dataset[5])
      })

      it('can find data by native() and modified after using query functions of query builder', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query
          .where('age', 40)
          .orWhere('age', 1000)
          .native(function(nativeQuery: any) {
            return nativeQuery.findOne({
              first_name: 'thor'
            })
          })
          .find()
        expect_match_user(result, dataset[3])
      })
    })

    describe('pluck()', function() {
      it('plucks all data of collection and returns an Object', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query.pluck('first_name', '_id')
        expect(Object.values(result)).toEqual(['john', 'jane', 'tony', 'thor', 'captain', 'tony', 'peter'])
      })

      it('returns an empty object if no result', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query.where('first_name', 'no-one').pluck('first_name')
        expect(result).toEqual({})
      })

      it('overrides select even .select was used', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query.select('abc', 'def').pluck('first_name', '_id')
        expect(query['selectedFields']).toEqual(['first_name', '_id'])
        expect(Object.values(result)).toEqual(['john', 'jane', 'tony', 'thor', 'captain', 'tony', 'peter'])
      })

      it('can pluck data by query builder, case 1', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query
          .where('age', 18)
          .orWhere('first_name', 'tony')
          .pluck('first_name')
        expect(Object.values(result)).toEqual(['tony', 'tony'])
      })

      it('can pluck data by query builder, case 2', async function() {
        const query = new MongooseQueryBuilder('User')
        const result = await query
          .where('age', 1000)
          .orWhere('first_name', 'captain')
          .orderBy('last_name')
          .pluck('last_name')
        expect(Object.values(result)).toEqual(['american', 'god'])
      })
    })
  })
})
