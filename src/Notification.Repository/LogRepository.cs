﻿using MongoDB.Bson;
using MongoDB.Driver;
using Notification.Entity.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository
{
    public class LogRepository : Connections.NotificationRepository<Log>
    {
        public IEnumerable<Log> Get(int page, int size)
        {
            return Collection.Find(new BsonDocument()).Skip(page * size).Limit(size).ToList();
        }

        public IEnumerable<Log> GetById(Guid id)
        {
            return Collection.Find(l => l.id == id).ToList();
        }

        public Guid InsertOne(Log entity)
        {
            Collection.InsertOne(entity);
            return entity.id;
        }

        public async Task<Guid> InsertOneAsync(Log entity)
        {
            await Collection.InsertOneAsync(entity);
            return entity.id;
        }        
    }
}
