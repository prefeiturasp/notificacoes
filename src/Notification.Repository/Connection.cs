﻿using MSTech.Data.Common;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository
{
    public class Connection
    {
        private static Dictionary<string, string> dicConnection = new Dictionary<string, string>();

        private Connection()
        {
        }

        public static string Get(string connectionName)
        {
            if (!dicConnection.ContainsKey(connectionName))
            {
                var str = GetFromConfig(connectionName);

                if (string.IsNullOrEmpty(str))
                {
                    str = GetFromWebConfig(str);
                }

                if (string.IsNullOrEmpty(str))
                    throw new MSTech.Data.Common.Exceptions.NullConnectionException();
                else
                    dicConnection.Add(connectionName, str);                
            }

            return dicConnection[connectionName];            
        }

        private static string GetFromConfig(string connectionName)
        {
            try
            {
                TalkDBTransactionCollection collection = new TalkDBTransactionCollection();

                if (collection.Contains(connectionName))
                    return collection[connectionName].GetConnection.ConnectionString;
                else
                    return null;
            }
            catch (FormatException)
            {
                return null;
            }
        }

        private static string GetFromWebConfig(string connectionName)
        {
            var config = ConfigurationManager.ConnectionStrings[connectionName];

            if (config == null)
                return null;
            
            return config.ConnectionString;
        }
    }
}
