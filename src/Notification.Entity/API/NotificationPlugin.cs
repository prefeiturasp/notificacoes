﻿using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.API
{
    [BsonIgnoreExtraElements]
    public class NotificationPlugin
    {
        public Guid Id { get; set; }

        public string SenderName { get; set; }
        
        public int MessageType { get; set; }

        public DateTime DateStartNotification { get; set; }

        public Nullable<DateTime> DateEndNotification { get; set; }

        public string Title { get; set; }

        public string Message { get; set; }
    }
}
