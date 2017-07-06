using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Notification.API.Models
{
    public class ErrorModel
    {
        public int Code { get; set; }

        public Nullable<Guid> ErrorId { get; set; }

        public string Message { get; set; }

        public ErrorModel(int code, string message)
        {
            Code = code;
            Message = message;
        }

        public ErrorModel(Guid id)
        {
            Code = -1;
            ErrorId = id;
            Message = null;
        }
    }
}