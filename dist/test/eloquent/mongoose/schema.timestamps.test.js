/**
 * This file is copied from schema.timestamps.test.js v5.0.0-rc2 of mongoose, I change 2 things
 *  - change before => beforeAll, after => afterAll and setup of mongoose
 *  - reformat file (because prettier does it automatically, fuuuuu)
 *
 * Source: https://github.com/Automattic/mongoose/blob/master/test/schema.timestamps.test.js
 * NOTE: this file will not be included in coverage report.
 */

/**
 * Test dependencies.
 */

var mongoose = require('mongoose'),
  assert = require('power-assert'),
  Schema = mongoose.Schema

Schema.prototype.setupTimestamp = require('../../../lib/eloquent/mongoose/setupTimestamp').setupTimestamp

describe('schema options.timestamps', function() {
  var conn

  beforeAll(function() {
    return new Promise(resolve => {
      mongoose.connect('mongodb://localhost/najs_eloquent_test_2')
      mongoose.Promise = global.Promise
      mongoose.connection.once('open', () => {
        resolve(true)
      })
      conn = mongoose
    })
  })

  afterAll(function(done) {
    return new Promise(resolve => {
      try {
        resolve(true)
      } catch (error) {}
    })
  })

  describe('create schema with options.timestamps', function() {
    it('should have createdAt and updatedAt fields', function(done) {
      var TestSchema = new Schema(
        {
          name: String
        },
        {
          timestamps: true
        }
      )

      assert.ok(TestSchema.path('createdAt'))
      assert.ok(TestSchema.path('updatedAt'))
      done()
    })

    it('should have createdAt and updatedAt fields', function(done) {
      var TestSchema = new Schema({
        name: String
      })

      TestSchema.set('timestamps', true)

      assert.ok(TestSchema.path('createdAt'))
      assert.ok(TestSchema.path('updatedAt'))
      done()
    })

    it('should have created and updatedAt fields', function(done) {
      var TestSchema = new Schema(
        {
          name: String
        },
        {
          timestamps: {
            createdAt: 'created'
          }
        }
      )

      assert.ok(TestSchema.path('created'))
      assert.ok(TestSchema.path('updatedAt'))
      done()
    })

    it('should have created and updatedAt fields', function(done) {
      var TestSchema = new Schema({
        name: String
      })

      TestSchema.set('timestamps', {
        createdAt: 'created'
      })

      assert.ok(TestSchema.path('created'))
      assert.ok(TestSchema.path('updatedAt'))
      done()
    })

    it('should have created and updated fields', function(done) {
      var TestSchema = new Schema(
        {
          name: String
        },
        {
          timestamps: {
            createdAt: 'created',
            updatedAt: 'updated'
          }
        }
      )

      assert.ok(TestSchema.path('created'))
      assert.ok(TestSchema.path('updated'))
      done()
    })

    it('should have created and updated fields', function(done) {
      var TestSchema = new Schema({
        name: String
      })

      TestSchema.set('timestamps', {
        createdAt: 'created',
        updatedAt: 'updated'
      })

      assert.ok(TestSchema.path('created'))
      assert.ok(TestSchema.path('updated'))
      done()
    })

    it('should not override createdAt when not selected (gh-4340)', function(done) {
      var TestSchema = new Schema(
        {
          name: String
        },
        {
          timestamps: true
        }
      )

      var Test = conn.model('Test', TestSchema)

      Test.create(
        {
          name: 'hello'
        },
        function(err, doc) {
          // Let’s save the dates to compare later.
          var createdAt = doc.createdAt
          var updatedAt = doc.updatedAt

          assert.ok(doc.createdAt)

          Test.findById(doc._id, { name: true }, function(err, doc) {
            // The dates shouldn’t be selected here.
            assert.ok(!doc.createdAt)
            assert.ok(!doc.updatedAt)

            doc.name = 'world'

            doc.save(function(err, doc) {
              // Let’s save the new updatedAt date as it should have changed.
              var newUpdatedAt = doc.updatedAt

              assert.ok(!doc.createdAt)
              assert.ok(doc.updatedAt)

              Test.findById(doc._id, function(err, doc) {
                // Let’s make sure that everything is working again by
                // comparing the dates with the ones we saved.
                assert.equal(doc.createdAt.valueOf(), createdAt.valueOf())
                assert.notEqual(doc.updatedAt.valueOf(), updatedAt.valueOf())
                assert.equal(doc.updatedAt.valueOf(), newUpdatedAt.valueOf())

                done()
              })
            })
          })
        }
      )
    })
  })

  describe('auto update createdAt and updatedAt when create/save/update document', function() {
    var CatSchema
    var Cat

    beforeAll(function(done) {
      CatSchema = new Schema(
        {
          name: String,
          hobby: String
        },
        { timestamps: true }
      )
      Cat = conn.model('Cat', CatSchema)
      Cat.remove({}, done)
    })

    it('should have fields when create', function(done) {
      var cat = new Cat({ name: 'newcat' })
      cat.save(function(err, doc) {
        assert.ok(doc.createdAt)
        assert.ok(doc.updatedAt)
        assert.ok(doc.createdAt.getTime() === doc.updatedAt.getTime())
        done()
      })
    })

    it('should have fields when create with findOneAndUpdate', function(done) {
      Cat.findOneAndUpdate({ name: 'notexistname' }, { $set: {} }, { upsert: true, new: true }, function(err, doc) {
        assert.ok(doc.createdAt)
        assert.ok(doc.updatedAt)
        assert.ok(doc.createdAt.getTime() === doc.updatedAt.getTime())
        done()
      })
    })

    it('should change updatedAt when save', function(done) {
      Cat.findOne({ name: 'newcat' }, function(err, doc) {
        var old = doc.updatedAt

        doc.hobby = 'coding'

        doc.save(function(err, doc) {
          assert.ok(doc.updatedAt.getTime() > old.getTime())
          done()
        })
      })
    })

    it('should not change updatedAt when save with no modifications', function(done) {
      Cat.findOne({ name: 'newcat' }, function(err, doc) {
        var old = doc.updatedAt

        doc.save(function(err, doc) {
          assert.ok(doc.updatedAt.getTime() === old.getTime())
          done()
        })
      })
    })

    it('should change updatedAt when findOneAndUpdate', function(done) {
      Cat.findOne({ name: 'newcat' }, function(err, doc) {
        var old = doc.updatedAt
        Cat.findOneAndUpdate({ name: 'newcat' }, { $set: { hobby: 'fish' } }, { new: true }, function(err, doc) {
          assert.ok(doc.updatedAt.getTime() > old.getTime())
          done()
        })
      })
    })

    it('should have fields when update', function(done) {
      Cat.findOne({ name: 'newcat' }, function(err, doc) {
        var old = doc.updatedAt
        Cat.update({ name: 'newcat' }, { $set: { hobby: 'fish' } }, function() {
          Cat.findOne({ name: 'newcat' }, function(err, doc) {
            assert.ok(doc.updatedAt.getTime() > old.getTime())
            done()
          })
        })
      })
    })

    it('nested docs (gh-4049)', function(done) {
      var GroupSchema = new Schema({
        cats: [CatSchema]
      })

      var Group = conn.model('gh4049', GroupSchema)
      var now = Date.now()
      Group.create({ cats: [{ name: 'Garfield' }] }, function(error, group) {
        assert.ifError(error)
        assert.ok(group.cats[0].createdAt)
        assert.ok(group.cats[0].createdAt.getTime() >= now)
        done()
      })
    })

    it('nested docs with push (gh-4049)', function(done) {
      var GroupSchema = new Schema({
        cats: [CatSchema]
      })

      var Group = conn.model('gh4049_0', GroupSchema)
      var now = Date.now()
      Group.create({ cats: [{ name: 'Garfield' }] }, function(error, group) {
        assert.ifError(error)
        group.cats.push({ name: 'Keanu' })
        group.save(function(error) {
          assert.ifError(error)
          Group.findById(group._id, function(error, group) {
            assert.ifError(error)
            assert.ok(group.cats[1].createdAt)
            assert.ok(group.cats[1].createdAt.getTime() > now)
            done()
          })
        })
      })
    })

    afterAll(function(done) {
      Cat.remove({}, done)
    })
  })
})
