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
    public class CalendarTests
    {
        [TestMethod()]
        public void CalendarGetTest()
        {

            string json = @"[{'Name':'2014'},{'Name':'2015'},{'Name':'2016'},{'Name':'2017'}]";
            var expected = JsonConvert.DeserializeObject<IEnumerable<Calendar>>(json);

            var actual = CalendarBusiness.Get();

            IEnumerator<Calendar> eFixo = expected.GetEnumerator();
            IEnumerator<Calendar> eBanco = actual.GetEnumerator();


            Assert.AreEqual(expected.Count(), actual.Count());
            while (eFixo.MoveNext() && eBanco.MoveNext())
            {
                Assert.AreEqual(eFixo.Current.Name, eBanco.Current.Name);
            }
        }
    }
}