using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.Cache
{
    public interface ICacher<T>
    {
        T GetValue(string key);

        void Add(string key, T value);

        void Remove(string key);
    }
}
