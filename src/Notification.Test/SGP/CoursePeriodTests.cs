using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Notification.Business.SGP;
using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Tests
{
    [TestClass()]
    public class CoursePeriodTests
    {
        [TestMethod()]
        public void CoursePeriodGetTest()
        {
            var actual = CoursePeriodBusiness.Get("2017",null);

            Assert.IsTrue(actual.Count() > 0);
        }
    }
}