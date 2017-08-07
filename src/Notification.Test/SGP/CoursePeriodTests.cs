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
            string json = @"[{'Id':'49|1|1','Name':'1° ano'},{'Id':'49|1|2','Name':'2° ano'},{'Id':'49|1|3','Name':'3° ano'},{'Id':'49|1|4','Name':'4° ano'},{'Id':'49|1|5','Name':'5° ano'},{'Id':'49|1|6','Name':'6° ano'},{'Id':'49|1|7','Name':'7° ano'},{'Id':'49|1|8','Name':'8° ano'},{'Id':'49|1|9','Name':'9° ano'},{'Id':'50|1|1','Name':'1° ano'},{'Id':'50|1|2','Name':'2° ano'},{'Id':'50|1|3','Name':'3° ano'},{'Id':'50|1|4','Name':'4° ano'},{'Id':'50|1|5','Name':'5° ano'},{'Id':'50|1|6','Name':'6° ano'},{'Id':'50|1|7','Name':'7° ano'},{'Id':'50|1|8','Name':'8° ano'},{'Id':'50|1|9','Name':'9° ano'},{'Id':'51|1|1','Name':'1ª série'},{'Id':'51|1|2','Name':'2ª série'},{'Id':'51|1|3','Name':'3ª série'},{'Id':'52|1|1','Name':'Fundamental I Libras'},{'Id':'55|1|1','Name':'1° ano'},{'Id':'55|1|2','Name':'2° ano'},{'Id':'55|1|3','Name':'3° ano'},{'Id':'55|1|4','Name':'4° ano'},{'Id':'55|1|5','Name':'5° ano'},{'Id':'55|1|6','Name':'6° ano'},{'Id':'55|1|7','Name':'7° ano'},{'Id':'55|1|8','Name':'8° ano'},{'Id':'55|1|9','Name':'9° ano'},{'Id':'56|1|1','Name':'1° ano'},{'Id':'56|1|2','Name':'2° ano'},{'Id':'56|1|3','Name':'3° ano'},{'Id':'56|1|4','Name':'4° ano'},{'Id':'56|1|5','Name':'5° ano'},{'Id':'56|1|6','Name':'6° ano'},{'Id':'56|1|7','Name':'7° ano'},{'Id':'56|1|8','Name':'8° ano'},{'Id':'56|1|9','Name':'9° ano'},{'Id':'57|1|1','Name':'1° ano'},{'Id':'57|1|2','Name':'2° ano'},{'Id':'57|1|3','Name':'3° ano'},{'Id':'57|1|4','Name':'4° ano'},{'Id':'57|1|5','Name':'5° ano'},{'Id':'57|1|6','Name':'6° ano'},{'Id':'57|1|7','Name':'7° ano'},{'Id':'57|1|8','Name':'8° ano'},{'Id':'57|1|9','Name':'9° ano'},{'Id':'58|1|1','Name':'1° ano'},{'Id':'58|1|2','Name':'2° ano'},{'Id':'58|1|3','Name':'3° ano'},{'Id':'58|1|4','Name':'4° ano'},{'Id':'58|1|5','Name':'5° ano'},{'Id':'58|1|6','Name':'6° ano'},{'Id':'58|1|7','Name':'7° ano'},{'Id':'58|1|8','Name':'8° ano'},{'Id':'58|1|9','Name':'9° ano'},{'Id':'45|1|5','Name':'Infantil I'},{'Id':'45|1|6','Name':'Infantil II'},{'Id':'46|1|5','Name':'Infantil I'},{'Id':'46|1|6','Name':'Infantil II'},{'Id':'47|1|4','Name':'Mini grupo II'},{'Id':'47|1|5','Name':'Infantil I'},{'Id':'47|1|6','Name':'Infantil II'},{'Id':'48|1|1','Name':'Berçario I'},{'Id':'48|1|2','Name':'Berçario II'},{'Id':'48|1|3','Name':'Mini grupo I'},{'Id':'48|1|4','Name':'Mini grupo II'},{'Id':'48|1|5','Name':'Infantil I'},{'Id':'48|1|6','Name':'Infantil II'},{'Id':'61|1|1','Name':'M I - Alfabetização'},{'Id':'61|1|2','Name':'M II - Básico'},{'Id':'61|1|3','Name':'M III - Complementar'},{'Id':'61|1|4','Name':'M IV - Final'},{'Id':'59|1|1','Name':'Alfabetização 1'},{'Id':'59|1|2','Name':'Alfabetização 2'},{'Id':'59|1|3','Name':'Básica 1'},{'Id':'59|1|4','Name':'Básica 2'},{'Id':'59|1|5','Name':'Complementar 1'},{'Id':'59|1|6','Name':'Complementar 2'},{'Id':'59|1|7','Name':'Final 3'},{'Id':'59|1|8','Name':'Final 4'},{'Id':'60|1|1','Name':'Alfabetização 1'},{'Id':'60|1|2','Name':'Alfabetização 2'},{'Id':'60|1|3','Name':'Básica 3'},{'Id':'60|1|4','Name':'Básica 4'},{'Id':'60|1|5','Name':'Complementar 3'},{'Id':'60|1|6','Name':'Complementar 4'},{'Id':'60|1|7','Name':'Final 3'},{'Id':'60|1|8','Name':'Final 4'},{'Id':'59|1|1','Name':'Alfabetização 1'},{'Id':'59|1|2','Name':'Alfabetização 2'},{'Id':'59|1|3','Name':'Básica 1'},{'Id':'59|1|4','Name':'Básica 2'},{'Id':'59|1|5','Name':'Complementar 1'},{'Id':'59|1|6','Name':'Complementar 2'},{'Id':'59|1|7','Name':'Final 3'},{'Id':'59|1|8','Name':'Final 4'},{'Id':'60|1|1','Name':'Alfabetização 1'},{'Id':'60|1|2','Name':'Alfabetização 2'},{'Id':'60|1|3','Name':'Básica 3'},{'Id':'60|1|4','Name':'Básica 4'},{'Id':'60|1|5','Name':'Complementar 3'},{'Id':'60|1|6','Name':'Complementar 4'},{'Id':'60|1|7','Name':'Final 3'},{'Id':'60|1|8','Name':'Final 4'}]";
            var expected = JsonConvert.DeserializeObject<IEnumerable<CoursePeriod>>(json);

            var actual = CoursePeriodBusiness.Get("2017",null);

            IEnumerator<CoursePeriod> eFixo = expected.GetEnumerator();
            IEnumerator<CoursePeriod> eBanco = actual.GetEnumerator();

            Assert.AreEqual(expected.Count(), actual.Count());
            while (eFixo.MoveNext() && eBanco.MoveNext())
            {
                Assert.AreEqual(eFixo.Current.Id, eBanco.Current.Id);
            }
        }
    }
}