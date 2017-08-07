using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Notification.Business.CoreSSO;
using Notification.Entity.API.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Tests
{
    [TestClass()]
    public class UserTests
    {
        [TestMethod()]
        public void UserGetTest()
        {
            Guid userId = new Guid("1538694e-12f2-e111-a89d-00155d02e702");

            string json = @"{'Id':'1538694e-12f2-e111-a89d-00155d02e702','Name':'RONALDO JOSE DA SILVEIRA'}";
            var expected = JsonConvert.DeserializeObject<User>(json);

            var actual = UserBusiness.Get(userId);

            Assert.AreEqual(expected.Id, actual.Id);
            Assert.AreEqual(expected.Name, actual.Name);

        }
    }
}