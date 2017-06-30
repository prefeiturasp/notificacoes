using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Caching;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.Cache
{
    public class Cacher<T> : ICacher<T>
    {
        private static Cacher<T> instance;
        private static MemoryCache cache = MemoryCache.Default;
        private static int expirationMinutes = 120;

        internal Cacher()
        {
            expirationMinutes = GetExpirationMinutes();
        }

        public static Cacher<T> Instance
        {
            get
            {
                if (instance == null)
                {
                    instance = new Cacher<T>();
                }
                return instance;
            }
        }

        public virtual int GetExpirationMinutes()
        {
            return expirationMinutes;
        }

        public T GetValue(string key)
        {
            if (cache.Contains(key))
                return (T)cache.Get(key);
            else
                return default(T);
        }

        public void Add(string key, T value)
        {
            if (cache.Contains(key))
                cache.Remove(key);

            cache.Add(key, value, DateTimeOffset.UtcNow.AddMinutes(expirationMinutes));
        }

        public void Remove(string key)
        {
            if (cache.Contains(key))
                cache.Remove(key);
        }
    }
}
